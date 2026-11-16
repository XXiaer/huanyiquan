package com.huanyiquan.servlet;

import com.huanyiquan.common.Params;
import com.huanyiquan.common.TokenUtil;
import com.huanyiquan.entity.User;
import com.huanyiquan.filter.SecurityFilter;
import com.huanyiquan.service.QrLoginService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * 桌面端二维码扫码登录接口：
 *   POST /api/auth/qr/create    创建扫码会话（免登录）
 *   GET  /api/auth/qr/status    轮询扫码状态（免登录，校验 pollSecret）
 *   POST /api/auth/qr/scan      手机端扫码标记已扫描（须手机端已登录）
 *   POST /api/auth/qr/confirm   手机端确认或取消登录（须手机端已登录）
 *   POST /api/auth/qr/exchange  桌面端换取正式登录凭证（免登录，校验 pollSecret）
 */
public class QrLoginServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if ("/api/auth/qr/status".equals(req.getServletPath())) {
            Params p = Params.of(req);
            ok(resp, QrLoginService.status(p.str("qrId"), p.str("pollSecret")));
            return;
        }
        throw notFound();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Params p = Params.of(req);
        switch (req.getServletPath()) {
            case "/api/auth/qr/create":
                ok(resp, QrLoginService.create(SecurityFilter.clientIp(req), req.getHeader("User-Agent")));
                return;
            case "/api/auth/qr/scan":
                ok(resp, QrLoginService.scan(uid(req), p.str("qr")));
                return;
            case "/api/auth/qr/confirm":
                ok(resp, QrLoginService.confirm(uid(req), p.str("qrId"), p.str("action", "confirm")));
                return;
            case "/api/auth/qr/exchange": {
                User user = QrLoginService.exchange(p.str("qrId"), p.str("pollSecret"));
                HttpSession previous = req.getSession(false);
                if (previous != null) previous.invalidate();
                HttpSession session = req.getSession(true);
                session.setAttribute("userId", user.id);
                session.setMaxInactiveInterval(2 * 60 * 60);
                String token = TokenUtil.issue(user.id);
                Cookie cookie = new Cookie(TokenUtil.COOKIE_NAME, token);
                cookie.setPath("/");
                cookie.setHttpOnly(true);
                cookie.setMaxAge(TokenUtil.MAX_AGE_SECONDS);
                resp.addCookie(cookie);
                resp.setHeader("X-Token", token);
                user.token = token;
                ok(resp, "扫码登录成功", user);
                return;
            }
            default:
                throw notFound();
        }
    }
}
