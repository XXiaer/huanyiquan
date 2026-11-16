package com.huanyiquan.filter;

import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.common.RateLimiter;
import com.huanyiquan.common.Result;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * 全局安全响应头与核心高危/高成本接口限流过滤器。
 */
public class SecurityFilter implements Filter {

    private static final long ONE_MINUTE_MS = 60_000L;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("X-Frame-Options", "SAMEORIGIN");
        resp.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        resp.setHeader("Permissions-Policy", "camera=(self)");

        String path = req.getRequestURI();
        String method = req.getMethod();
        if (path != null) {
            String ip = clientIp(req);
            if ("GET".equalsIgnoreCase(method) && "/api/captcha/new".equals(path)) {
                if (!RateLimiter.allow(ip + ":captcha_get", 40, ONE_MINUTE_MS)) {
                    rejectTooMany(resp);
                    return;
                }
            } else if ("GET".equalsIgnoreCase(method) && "/api/auth/qr/status".equals(path)) {
                if (!RateLimiter.allow(ip + ":qr_poll", 120, ONE_MINUTE_MS)) {
                    rejectTooMany(resp);
                    return;
                }
            } else if ("POST".equalsIgnoreCase(method)) {
                if ("/api/captcha/verify".equals(path)) {
                    if (!RateLimiter.allow(ip + ":captcha_verify", 40, ONE_MINUTE_MS)) {
                        rejectTooMany(resp);
                        return;
                    }
                } else if ("/api/auth/qr/create".equals(path)) {
                    if (!RateLimiter.allow(ip + ":qr_create", 30, ONE_MINUTE_MS)) {
                        rejectTooMany(resp);
                        return;
                    }
                } else if (path.startsWith("/api/ai/")) {
                    if (!RateLimiter.allow(ip + ":ai", 12, ONE_MINUTE_MS)) {
                        rejectTooMany(resp);
                        return;
                    }
                } else if (path.startsWith("/api/user/login") || path.startsWith("/api/user/register")) {
                    if (!RateLimiter.allow(ip + ":auth", 20, ONE_MINUTE_MS)) {
                        rejectTooMany(resp);
                        return;
                    }
                } else if ("/api/upload".equals(path)) {
                    if (!RateLimiter.allow(ip + ":upload", 25, ONE_MINUTE_MS)) {
                        rejectTooMany(resp);
                        return;
                    }
                }
            }
        }

        chain.doFilter(request, response);
    }

    public static String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.trim().isEmpty()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.trim().isEmpty()) {
            return realIp.trim();
        }
        return req.getRemoteAddr();
    }

    private static void rejectTooMany(HttpServletResponse resp) throws IOException {
        resp.setStatus(429);
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write(JsonUtil.MAPPER.writeValueAsString(Result.fail(429, "操作过于频繁，请稍后再试")));
    }
}
