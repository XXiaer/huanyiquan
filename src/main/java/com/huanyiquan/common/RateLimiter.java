package com.huanyiquan.common;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 轻量级内存固定窗口限流器，用于保护登录、注册、发信、AI 估价与上传接口。
 */
public final class RateLimiter {

    private static final class Window {
        final long startMillis;
        final AtomicInteger count = new AtomicInteger(0);

        Window(long startMillis) {
            this.startMillis = startMillis;
        }
    }

    private static final int MAX_BUCKETS = 20_000;
    private static final ConcurrentHashMap<String, Window> BUCKETS = new ConcurrentHashMap<>();
    private static volatile long lastCleanupAt = 0L;

    private RateLimiter() {
    }

    /**
     * 尝试获取一次请求配额。
     *
     * @param key          限流键（例如 ip + ":" + group）
     * @param maxRequests  窗口内允许的最大请求数
     * @param windowMillis 窗口时长（毫秒）
     * @return true 允许通过，false 已触发限流
     */
    public static boolean allow(String key, int maxRequests, long windowMillis) {
        long now = System.currentTimeMillis();
        maybeCleanup(now, windowMillis);
        if (BUCKETS.size() >= MAX_BUCKETS && !BUCKETS.containsKey(key)) {
            BUCKETS.clear();
        }
        Window w = BUCKETS.compute(key, (k, existing) -> {
            if (existing == null || now - existing.startMillis >= windowMillis) {
                return new Window(now);
            }
            return existing;
        });
        return w.count.incrementAndGet() <= maxRequests;
    }

    private static void maybeCleanup(long now, long windowMillis) {
        if (BUCKETS.size() < 2000 && now - lastCleanupAt < 60_000L) {
            return;
        }
        lastCleanupAt = now;
        long maxAge = Math.max(windowMillis, 120_000L);
        Iterator<Map.Entry<String, Window>> it = BUCKETS.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Window> e = it.next();
            if (now - e.getValue().startMillis >= maxAge) {
                it.remove();
            }
        }
    }
}
