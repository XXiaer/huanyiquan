package com.huanyiquan.servlet;

import com.huanyiquan.common.Params;
import com.huanyiquan.common.TokenUtil;
import com.huanyiquan.entity.User;
import com.huanyiquan.filter.SecurityFilter;
import com.huanyiquan.service.CaptchaService;
import com.huanyiquan.service.EmailVerificationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/** Exact routes keep the established account profile and password APIs in UserServlet. */
public class AuthEntryServlet extends BaseServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Params p = Params.of(req);
        String ip = SecurityFilter.clientIp(req);
        switch (req.getServletPath()) {
            case "/api/user/register/email/send":
                CaptchaService.consumeTicket(ip, p.str("captchaToken"));
                EmailVerificationService.sendRegistration(p.str("studentNo"), p.str("email"));
                ok(resp, null);
                return;
            case "/api/user/register":
                CaptchaService.consumeTicket(ip, p.str("captchaToken"));
                User created = EmailVerificationService.register(p.str("studentNo"), p.str("nickname"),
                        p.str("password"), p.str("college"), p.str("building"), p.str("email"), p.str("code"));
                login(req, resp, created, "注册成功，已自动登录");
                return;
            case "/api/user/login/email/send":
                CaptchaService.consumeTicket(ip, p.str("captchaToken"));
                EmailVerificationService.sendLogin(p.str("email"));
                ok(resp, null);
                return;
            case "/api/user/login/email/code":
                CaptchaService.consumeTicket(ip, p.str("captchaToken"));
                login(req, resp, EmailVerificationService.loginByCode(p.str("email"), p.str("code")), "登录成功");
                return;
            case "/api/user/login/email/password":
                CaptchaService.consumeTicket(ip, p.str("captchaToken"));
                login(req, resp, EmailVerificationService.loginByPassword(p.str("email"), p.str("password")), "登录成功");
                return;
            default: throw notFound();
        }
    }

    private void login(HttpServletRequest req, HttpServletResponse resp, User user, String msg) throws IOException {
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
        ok(resp, msg, user);
    }
}
