package com.huanyiquan.filter;

import com.huanyiquan.common.Const;
import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.common.Result;
import com.huanyiquan.common.TokenUtil;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.entity.User;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 登录校验 + 跨域放行 + 编码设置，三件事一起做。
 * 白名单只放行：注册、登录、物品公开列表、物品详情、图片、用户公开主页。
 */
public class LoginFilter implements Filter {

    /** 免登录的 POST 接口 */
    private static final Set<String> OPEN_POST =
            new HashSet<>(Arrays.asList("/api/user/register", "/api/user/register/email/send", "/api/user/login",
                    "/api/user/login/email/send", "/api/user/login/email/code", "/api/user/login/email/password",
                    "/api/ai/appraise", "/api/ai/scan-search"));

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        req.setCharacterEncoding("UTF-8");
        String uri = path(req);
        // 图片是二进制流，别给 Content-Type 挂上 charset
        if (!uri.startsWith("/api/file/")) {
            resp.setCharacterEncoding("UTF-8");
        }
        cors(req, resp);

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }

        if ("GET".equalsIgnoreCase(req.getMethod()) && uri.matches("^/api/item/\\d+$") && req.getSession(false) == null) {
            restore(req); // 公开详情仍应识别带签名凭证的物品所有者
        }
        if (!isOpen(req, uri)) {
            HttpSession session = req.getSession(false);
            Long userId = session == null ? null : asLong(session.getAttribute("userId"));
            // 账号不存在或已被管理员封禁时，立即销毁旧会话并返回 401
            User current = userId == null ? null : UserDao.findById(userId);
            if (userId != null && (current == null || current.status == null || current.status != 1)) {
                session.invalidate();
                userId = null;
            }
            if (userId == null) {
                // 服务重启后内存 session 会丢，这里用签名 cookie 把登录状态接回来
                Long restored = restore(req);
                if (restored == null) {
                    JsonUtil.write(resp, Result.fail(Const.CODE_UNAUTHORIZED, "登录状态已失效，请重新登录"));
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private Long asLong(Object v) {
        if (v instanceof Number) {
            return ((Number) v).longValue();
        }
        return null;
    }

    private boolean isOpen(HttpServletRequest req, String uri) {
        // 只守接口。静态资源（页面、样式、脚本、设计稿）与登录无关，由 StaticServlet 处理
        if (!uri.startsWith("/api/")) {
            return true;
        }
        String method = req.getMethod();
        if ("POST".equalsIgnoreCase(method) && OPEN_POST.contains(uri)) {
            return true;
        }
        if (!"GET".equalsIgnoreCase(method)) {
            return false;
        }
        if (uri.startsWith("/api/file/") || uri.startsWith("/api/meta/")) {
            return true;
        }
        if ("/api/auction".equals(uri) || "/api/auction/".equals(uri)) return true;
        if ("/api/item/search".equals(uri)) return true;
        if ("/api/item/list".equals(uri) || "/api/item".equals(uri)) {
            return true;
        }
        return uri.matches("^/api/item/\\d+$")
                || uri.matches("^/api/item/user/\\d+$")
                || uri.matches("^/api/user/\\d+$")
                || uri.matches("^/api/user/\\d+/credit$")
                || uri.matches("^/api/review/user/\\d+$");
    }

    /**
     * 用签名凭证重建 session，返回 userId；凭证无效返回 null。
     * 先读 X-Token 请求头，再退回 cookie。请求头这条路不依赖浏览器是否允许写 cookie。
     */
    private Long restore(HttpServletRequest req) {
        String token = req.getHeader("X-Token");
        if (token == null || token.trim().isEmpty()) {
            Cookie[] cookies = req.getCookies();
            if (cookies != null) {
                for (Cookie c : cookies) {
                    if (TokenUtil.COOKIE_NAME.equals(c.getName())) {
                        token = c.getValue();
                        break;
                    }
                }
            }
        }
        Long userId = TokenUtil.verify(token);
        if (userId == null) {
            return null;
        }
        User u = UserDao.findById(userId);
        if (u == null || u.status == null || u.status != 1) {
            return null;
        }
        HttpSession session = req.getSession(true);
        session.setAttribute("userId", userId);
        session.setMaxInactiveInterval(2 * 60 * 60);
        return userId;
    }

    private String path(HttpServletRequest req) {
        String uri = req.getRequestURI();
        String ctx = req.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            uri = uri.substring(ctx.length());
        }
        return uri;
    }

    private void cors(HttpServletRequest req, HttpServletResponse resp) {
        String origin = req.getHeader("Origin");
        if (origin != null && isAllowedOrigin(req, origin)) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
            resp.setHeader("Access-Control-Allow-Credentials", "true");
            resp.setHeader("Vary", "Origin");
            resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            resp.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Requested-With,X-Token");
            resp.setHeader("Access-Control-Max-Age", "3600");
        }
    }

    private boolean isAllowedOrigin(HttpServletRequest req, String origin) {
        try {
            java.net.URI u = java.net.URI.create(origin.trim());
            String host = u.getHost();
            if (host == null) {
                return false;
            }
            if (host.equalsIgnoreCase(req.getServerName())) {
                return true;
            }
            if ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host)) {
                return "localhost".equalsIgnoreCase(req.getServerName())
                        || "127.0.0.1".equals(req.getServerName());
            }
            String extra = System.getenv("CORS_ORIGINS");
            if (extra != null && !extra.isBlank()) {
                for (String item : extra.split(",")) {
                    if (origin.equalsIgnoreCase(item.trim())) {
                        return true;
                    }
                }
            }
            return false;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
