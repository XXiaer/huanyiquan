package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.entity.Item;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;

public final class SemanticSearchService {

    private static final int MAX_RESULTS = 40;
    private static final int SEMANTIC_KEEP = 30;

    private SemanticSearchService() {
    }

    public static Map<String, Object> search(String q, String category, String condition, String building,
                                             int tradeMode, String sort, int page, int size) {
        if (q == null || q.trim().isEmpty() || q.length() > 200) {
            throw BizException.badRequest("请输入不超过 200 字的搜索内容");
        }
        String query = q.trim();
        RemoteResult response = remote(query, category, condition, building, tradeMode);
        Map<Long, Item> current = new HashMap<>();
        for (Item item : ItemDao.findOnShelfByIds(response.ids)) current.put(item.id, item);

        LinkedHashSet<Long> seen = new LinkedHashSet<>();
        List<Item> ranked = new ArrayList<>();
        for (Long id : response.ids) {
            Item item = current.get(id);
            if (item != null && matchesFilters(item, category, condition, building, tradeMode) && seen.add(id)) {
                ranked.add(item);
            }
        }
        boolean semanticHit = !ranked.isEmpty();

        // A recognized product or explicit constraint is authoritative, including an empty result.
        if (!response.strict) {
            Integer mode = tradeMode == 1 || tradeMode == 2 || tradeMode == 4 ? tradeMode : null;
            for (Item item : ItemDao.list(category, condition, building, query, null, Const.ITEM_ON,
                    mode, sort, 0, MAX_RESULTS)) {
                if (ranked.size() == MAX_RESULTS) break;
                if (matchesFilters(item, category, condition, building, tradeMode) && seen.add(item.id)) {
                    ranked.add(item);
                }
            }
        }
        if ("latest".equals(sort)) {
            ranked.sort(Comparator.comparing((Item it) -> it.createTime,
                    Comparator.nullsLast(Comparator.reverseOrder())));
        } else if ("price_asc".equals(sort) || "price_desc".equals(sort)) {
            Comparator<Integer> order = "price_asc".equals(sort) ? Comparator.naturalOrder() : Comparator.reverseOrder();
            ranked.sort(Comparator.comparing(it -> hasPrice(it) ? it.price : null, Comparator.nullsLast(order)));
        }

        int p = Math.max(1, page);
        int n = size <= 0 ? 20 : Math.min(size, 50);
        int from = (int) Math.min((long) (p - 1) * n, ranked.size());
        int to = Math.min(from + n, ranked.size());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("list", ranked.subList(from, to));
        result.put("total", ranked.size());
        result.put("page", p);
        result.put("size", n);
        result.put("hasMore", to < ranked.size());
        result.put("conditions", response.conditions);
        result.put("searchMode", semanticHit || response.strict ? "semantic" : "keyword");
        return result;
    }

    private static boolean hasPrice(Item item) {
        return item.price != null && item.price > 0 && !Objects.equals(item.tradeMode, 2);
    }

    private static boolean matchesFilters(Item item, String category, String condition, String building, int mode) {
        if (category != null && !category.isBlank() && !category.trim().equals(item.category)) return false;
        if (condition != null && !condition.isBlank() && !condition.trim().equals(item.conditionLevel)) return false;
        if (building != null && !building.isBlank() && !building.trim().equals(item.ownerBuilding)
                && !Objects.toString(item.place, "").contains(building.trim())) return false;
        int itemMode = item.tradeMode == null ? (hasPrice(item) ? 4 : 2) : item.tradeMode;
        if (mode == 1) return hasPrice(item) && (itemMode == 1 || itemMode == 4);
        if (mode == 2) return itemMode == 2 || itemMode == 4;
        return mode != 4 || itemMode == 4;
    }

    private static String encode(String value) {
        return URLEncoder.encode(Objects.toString(value, "").trim(), StandardCharsets.UTF_8);
    }

    private static RemoteResult remote(String query, String category, String condition, String building, int mode) {
        try {
            String base = System.getenv().getOrDefault("SEMANTIC_URL", "http://127.0.0.1:18084");
            URL url = new URL(base + "/search?q=" + encode(query)
                    + "&category=" + encode(category) + "&condition=" + encode(condition)
                    + "&building=" + encode(building) + "&tradeMode=" + mode);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(1000);
            connection.setReadTimeout(8000);
            try (InputStream input = connection.getInputStream()) {
                var payload = JsonUtil.MAPPER.readTree(input);
                List<Long> ids = new ArrayList<>();
                for (var row : payload.path("results")) {
                    long id = row.path("id").asLong();
                    if (id > 0) ids.add(id);
                    if (ids.size() >= SEMANTIC_KEEP) break;
                }
                List<String> conditions = new ArrayList<>();
                for (var label : payload.path("conditions")) {
                    if (label.isTextual()) conditions.add(label.asText());
                }
                return new RemoteResult(ids, conditions, payload.path("strict").asBoolean() || !conditions.isEmpty());
            } finally {
                connection.disconnect();
            }
        } catch (Exception ignored) {
            return new RemoteResult(List.of(), List.of(), false);
        }
    }

    private static final class RemoteResult {
        final List<Long> ids;
        final List<String> conditions;
        final boolean strict;

        RemoteResult(List<Long> ids, List<String> conditions, boolean strict) {
            this.ids = ids;
            this.conditions = conditions;
            this.strict = strict;
        }
    }
}
