package com.huanyiquan.common;

import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 统一参数读取：先看 JSON 请求体，再看表单 / 查询串。
 * 这样同一套 Service 既能吃 axios 的 JSON，也能吃浏览器表单。
 */
public final class Params {

    private final Map<String, Object> body;
    private final HttpServletRequest req;

    private Params(Map<String, Object> body, HttpServletRequest req) {
        this.body = body;
        this.req = req;
    }

    public static Params of(HttpServletRequest req) throws IOException {
        return new Params(JsonUtil.bodyMap(req), req);
    }

    public String str(String key) {
        Object v = body.get(key);
        if (v != null) {
            return String.valueOf(v).trim();
        }
        String q = req.getParameter(key);
        return q == null ? null : q.trim();
    }

    public String str(String key, String defaultValue) {
        String v = str(key);
        return Str.isBlank(v) ? defaultValue : v;
    }

    public Long lng(String key) {
        String v = str(key);
        if (Str.isBlank(v)) {
            return null;
        }
        try {
            return Long.valueOf(v);
        } catch (NumberFormatException e) {
            throw BizException.badRequest("参数 " + key + " 必须是数字");
        }
    }

    public long lngOr(String key, long defaultValue) {
        Long v = lng(key);
        return v == null ? defaultValue : v;
    }

    public Integer intOf(String key, Integer defaultValue) {
        String v = str(key);
        if (Str.isBlank(v)) {
            return defaultValue;
        }
        try {
            return Integer.valueOf(v);
        } catch (NumberFormatException e) {
            throw BizException.badRequest("参数 " + key + " 必须是数字");
        }
    }

    public List<Long> longList(String key) {
        Object v = body.get(key);
        if (v instanceof List) {
            List<Long> out = new ArrayList<>();
            for (Object o : (List<?>) v) {
                if (o == null) {
                    continue;
                }
                try {
                    out.add(Long.valueOf(String.valueOf(o)));
                } catch (NumberFormatException e) {
                    throw BizException.badRequest("参数 " + key + " 含非数字项");
                }
            }
            return out;
        }
        String s = str(key);
        if (Str.isBlank(s)) {
            return Collections.emptyList();
        }
        List<Long> out = new ArrayList<>();
        for (String part : s.split(",")) {
            if (Str.hasText(part)) {
                try {
                    out.add(Long.valueOf(part.trim()));
                } catch (NumberFormatException e) {
                    throw BizException.badRequest("参数 " + key + " 含非数字项");
                }
            }
        }
        return out;
    }

    public boolean has(String key) {
        return body.containsKey(key) || req.getParameter(key) != null;
    }
}
