package com.huanyiquan.dao;

import com.huanyiquan.common.Const;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Item;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 物品表 DAO。列表查询用 PreparedStatement 动态拼条件，条件为空不参与拼接。 */
public final class ItemDao {

    private static final String BASE_SELECT =
            "SELECT i.*, u.nickname AS owner_nick, u.building AS owner_build, u.credit AS owner_credit"
                    + " FROM `item` i JOIN `user` u ON u.id=i.owner_id WHERE i.deleted=0 ";

    private static final DBUtil.RowMapper<Item> MAP = rs -> {
        Item it = new Item();
        it.id = rs.getLong("id");
        it.ownerId = rs.getLong("owner_id");
        it.title = rs.getString("title");
        it.category = rs.getString("category");
        it.conditionLevel = rs.getString("condition_level");
        it.description = rs.getString("description");
        it.images = rs.getString("images");
        it.expectDesc = rs.getString("expect_desc");
        Object priceObj = rs.getObject("price");
        it.price = priceObj == null ? null : ((Number) priceObj).intValue();
        Object origObj = rs.getObject("original_price");
        it.originalPrice = origObj == null ? null : ((Number) origObj).intValue();
        Object modeObj = rs.getObject("trade_mode");
        it.tradeMode = modeObj == null ? (it.price != null && it.price > 0 ? 4 : 2) : ((Number) modeObj).intValue();
        it.place = rs.getString("place");
        it.wantText = rs.getString("want_text");
        it.brand = rs.getString("brand");
        it.delivery = rs.getString("delivery");
        Object bargainObj = rs.getObject("allow_bargain");
        it.allowBargain = bargainObj == null || ((Number) bargainObj).intValue() != 0;
        it.status = rs.getInt("status");
        it.isDemo = rs.getBoolean("is_demo");
        it.allowCycle = rs.getBoolean("allow_cycle");
        it.autoMatch = rs.getBoolean("auto_match");
        it.offerCount = rs.getInt("offer_count");
        it.viewCount = rs.getInt("view_count");
        it.createTime = rs.getObject("create_time", LocalDateTime.class);
        it.updateTime = rs.getObject("update_time", LocalDateTime.class);
        it.ownerNickname = rs.getString("owner_nick");
        it.ownerBuilding = rs.getString("owner_build");
        it.ownerCredit = rs.getInt("owner_credit");
        it.statusText = Const.itemStatusText(it.status == null ? 0 : it.status);
        return it;
    };

    private ItemDao() {
    }

    public static List<Item> socialItems(long user, boolean history) {
        String table = history ? "social_history" : "social_favorite";
        String order = history ? "viewed_at" : "created_at";
        return DBUtil.query(BASE_SELECT.replace(" WHERE i.deleted=0 ",
                " JOIN " + table + " x ON x.item_id=i.id WHERE i.deleted=0 ")
                + "AND x.user_id=? ORDER BY x." + order + " DESC,i.id DESC LIMIT 100", MAP, user);
    }

    public static long socialItemCount(long user, boolean history) {
        return DBUtil.count("SELECT COUNT(*) FROM " + (history ? "social_history" : "social_favorite")
                + " x JOIN item i ON i.id=x.item_id WHERE x.user_id=? AND i.deleted=0", user);
    }

    public static List<Map<String, Object>> recentDeals(int size) {
        return DBUtil.query("SELECT title,update_time FROM item WHERE status=? AND deleted=0 AND is_demo=0 "
                        + "ORDER BY update_time DESC,id DESC LIMIT ?",
                rs -> Map.of("title", rs.getString("title"), "updateTime", rs.getObject("update_time", LocalDateTime.class)),
                Const.ITEM_SWAPPED, Math.max(1, Math.min(30, size)));
    }

    public static Item findById(long id) {
        return DBUtil.queryOne(BASE_SELECT + " AND i.id=?", MAP, id);
    }

    public static List<Item> findOnShelfByIds(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        List<Object> args = new ArrayList<>(ids);
        args.add(Const.ITEM_ON);
        return DBUtil.query(BASE_SELECT + " AND i.id IN (" + placeholders + ") AND i.status=?", MAP, args.toArray());
    }

    /** 事务内读，保证读到的是同一笔事务里的状态 */
    public static Item findById(Connection c, long id) {
        return DBUtil.queryOne(c, BASE_SELECT + " AND i.id=?", MAP, id);
    }

    public static long insert(Connection c, Item it) {
        return DBUtil.insert(c,
                "INSERT INTO `item`(owner_id,title,category,condition_level,description,images,expect_desc,"
                        + "price,original_price,trade_mode,place,want_text,brand,delivery,allow_bargain,"
                        + "status,allow_cycle,auto_match,offer_count,view_count,create_time,review_submitted_at)"
                        + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?,NOW())",
                it.ownerId, it.title, it.category, it.conditionLevel, it.description, it.images,
                it.expectDesc, it.price, it.originalPrice,
                it.tradeMode == null ? (it.price != null && it.price > 0 ? 4 : 2) : it.tradeMode,
                it.place, it.wantText, it.brand,
                it.delivery == null ? "仅面交" : it.delivery,
                it.allowBargain == null || it.allowBargain ? 1 : 0,
                it.status == null ? Const.ITEM_ON : it.status,
                it.allowCycle == null || it.allowCycle,
                it.autoMatch == null || it.autoMatch,
                LocalDateTime.now());
    }

    public static void updateFields(Connection c, Item it) {
        DBUtil.update(c, "UPDATE `item` SET title=?, category=?, condition_level=?, description=?,"
                        + " images=?, expect_desc=?, price=?, original_price=?, trade_mode=?,"
                        + " place=?, want_text=?, brand=?, delivery=?, allow_bargain=?,"
                        + " allow_cycle=?, auto_match=? WHERE id=?",
                it.title, it.category, it.conditionLevel, it.description, it.images,
                it.expectDesc, it.price, it.originalPrice,
                it.tradeMode == null ? (it.price != null && it.price > 0 ? 4 : 2) : it.tradeMode,
                it.place, it.wantText, it.brand,
                it.delivery == null ? "仅面交" : it.delivery,
                it.allowBargain == null || it.allowBargain ? 1 : 0,
                it.allowCycle, it.autoMatch, it.id);
    }

    public static void updateStatus(long id, int status) {
        DBUtil.update("UPDATE `item` SET status=?,review_submitted_at=CASE WHEN ?=5 THEN NOW() ELSE review_submitted_at END WHERE id=?", status,status,id);
    }

    public static void updateStatus(Connection c, long id, int status) {
        DBUtil.update(c, "UPDATE `item` SET status=?,review_submitted_at=CASE WHEN ?=5 THEN NOW() ELSE review_submitted_at END WHERE id=?", status,status,id);
    }

    public static long countOnShelf(long ownerId) {
        return DBUtil.count("SELECT COUNT(*) FROM `item` WHERE owner_id=? AND status=? AND deleted=0",
                ownerId, Const.ITEM_ON);
    }

    public static long countByStatus(Integer status) {
        if (status == null) {
            return DBUtil.count("SELECT COUNT(*) FROM `item` WHERE deleted=0");
        }
        return DBUtil.count("SELECT COUNT(*) FROM `item` WHERE deleted=0 AND status=?", status);
    }

    public static void incrOfferCount(Connection c, long id) {
        DBUtil.update(c, "UPDATE `item` SET offer_count=offer_count+1 WHERE id=?", id);
    }

    public static void incrViewCount(long id) {
        DBUtil.update("UPDATE `item` SET view_count=view_count+1 WHERE id=?", id);
    }

    /** 重复提交拦截：同一人 1 分钟内同名物品视为重复发布 */
    public static Long findRecentDuplicate(long ownerId, String title) {
        return DBUtil.queryOne("SELECT id FROM `item` WHERE owner_id=? AND title=? AND deleted=0"
                        + " AND create_time > ? ORDER BY id DESC LIMIT 1",
                rs -> rs.getLong(1), ownerId, title, LocalDateTime.now().minusMinutes(1));
    }

    /** 按主键批量取在架物品，给语义搜索用：只取命中的那几十条，不再全表捞一万条。 */
    public static List<Item> listByIds(List<Long> ids, Integer status) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        StringBuilder in = new StringBuilder();
        List<Object> args = new ArrayList<>();
        if (status != null) {
            args.add(status);
        }
        for (Long id : ids) {
            in.append(in.length() == 0 ? "?" : ",?");
            args.add(id);
        }
        String sql = BASE_SELECT + (status != null ? " AND i.status=?" : "")
                + " AND i.id IN (" + in + ")";
        return DBUtil.query(sql, MAP, args.toArray());
    }

    public static List<Item> list(String category, String condition, String building, String keyword,
                                  Long ownerId, Integer status, int offset, int size) {
        return list(category, condition, building, keyword, ownerId, status, null, null, offset, size);
    }

    public static List<Item> list(String category, String condition, String building, String keyword,
                                  Long ownerId, Integer status, Integer tradeMode, String sort,
                                  int offset, int size) {
        StringBuilder sql = new StringBuilder(BASE_SELECT);
        List<Object> args = new ArrayList<>();
        appendWhere(sql, args, category, condition, building, keyword, ownerId, status, tradeMode);
        if ("price_asc".equals(sort)) {
            sql.append(" ORDER BY (i.price IS NULL OR i.price<=0) ASC, i.price ASC, i.id DESC LIMIT ?,?");
        } else if ("price_desc".equals(sort)) {
            sql.append(" ORDER BY (i.price IS NULL OR i.price<=0) ASC, i.price DESC, i.id DESC LIMIT ?,?");
        } else if ("latest".equals(sort)) {
            sql.append(" ORDER BY i.is_demo ASC, i.create_time DESC, i.id DESC LIMIT ?,?");
        } else {
            sql.append(" ORDER BY i.is_demo ASC, CASE WHEN i.is_demo=1 THEN MOD(i.id*7919,997) ELSE 0 END, CASE WHEN EXISTS (SELECT 1 FROM social_refresh r WHERE r.user_id=i.owner_id AND r.item_id=i.id AND r.refreshed_on=CURRENT_DATE) THEN i.update_time ELSE i.create_time END DESC, i.id DESC LIMIT ?,?");
        }
        args.add(offset);
        args.add(size);
        return DBUtil.query(sql.toString(), MAP, args.toArray());
    }

    public static long countList(String category, String condition, String building, String keyword,
                                 Long ownerId, Integer status) {
        return countList(category, condition, building, keyword, ownerId, status, null);
    }

    public static long countList(String category, String condition, String building, String keyword,
                                 Long ownerId, Integer status, Integer tradeMode) {
        StringBuilder sql = new StringBuilder(
                "SELECT COUNT(*) FROM `item` i JOIN `user` u ON u.id=i.owner_id WHERE i.deleted=0 ");
        List<Object> args = new ArrayList<>();
        appendWhere(sql, args, category, condition, building, keyword, ownerId, status, tradeMode);
        return DBUtil.count(sql.toString(), args.toArray());
    }

    private static void appendWhere(StringBuilder sql, List<Object> args, String category, String condition,
                                    String building, String keyword, Long ownerId, Integer status,
                                    Integer tradeMode) {
        if (status != null) {
            sql.append(" AND i.status=?");
            args.add(status);
        }
        if (ownerId != null) {
            sql.append(" AND i.owner_id=?");
            args.add(ownerId);
        }
        if (category != null && !category.trim().isEmpty()) {
            sql.append(" AND i.category=?");
            args.add(category.trim());
        }
        if (condition != null && !condition.trim().isEmpty()) {
            sql.append(" AND i.condition_level=?");
            args.add(condition.trim());
        }
        if (building != null && !building.trim().isEmpty()) {
            String b = building.trim();
            sql.append(" AND (u.building=? OR i.place LIKE ?)");
            args.add(b);
            args.add("%" + b + "%");
        }
        if (tradeMode != null) {
            if (tradeMode == 1) {
                sql.append(" AND (i.trade_mode IN (1,4) OR (i.price IS NOT NULL AND i.price>0 AND i.trade_mode<>2))");
            } else if (tradeMode == 2) {
                sql.append(" AND (i.trade_mode IN (2,4) OR i.trade_mode IS NULL)");
            } else if (tradeMode == 4) {
                sql.append(" AND i.trade_mode=4");
            }
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            sql.append(" AND (i.title LIKE ? OR i.description LIKE ?)");
            String like = "%" + keyword.trim() + "%";
            args.add(like);
            args.add(like);
        }
    }

    /** 环匹配第二步：按意向找出「我想要的那件东西」的所有可换候选 */
    public static List<Item> listWanted(Long wantItemId, String wantCategory, long excludeOwnerId, int limit) {
        StringBuilder sql = new StringBuilder(BASE_SELECT);
        sql.append(" AND i.status=? AND i.is_demo=0 AND i.allow_cycle=1 AND i.owner_id<>? AND u.status=1 AND u.credit>=60");
        List<Object> args = new ArrayList<>();
        args.add(Const.ITEM_ON);
        args.add(excludeOwnerId);
        if (wantItemId != null) {
            sql.append(" AND i.id=?");
            args.add(wantItemId);
        } else if (wantCategory != null && !wantCategory.trim().isEmpty()) {
            sql.append(" AND i.category=?");
            args.add(wantCategory.trim());
        }
        sql.append(" ORDER BY i.create_time DESC LIMIT ?");
        args.add(Math.max(1, limit));
        return DBUtil.query(sql.toString(), MAP, args.toArray());
    }

    /** 看板：热门类别 */
    public static List<Map<String, Object>> hotCategories(int limit) {
        return DBUtil.query("SELECT category AS cate, COUNT(*) AS total FROM `item` WHERE deleted=0"
                        + " GROUP BY category ORDER BY total DESC LIMIT ?",
                rs -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("category", rs.getString("cate"));
                    m.put("total", rs.getLong("total"));
                    return m;
                }, Math.max(1, limit));
    }
}
