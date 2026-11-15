package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.common.Params;
import com.huanyiquan.common.TokenUtil;
import com.huanyiquan.entity.User;
import com.huanyiquan.service.ReviewService;
import com.huanyiquan.service.UserService;
import com.huanyiquan.service.EmailVerificationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

/** 账号：注册、登录、退出、我的信息、个人主页、改资料。 */
public class UserServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo() == null ? "/" : req.getPathInfo();
        Params p = Params.of(req);

        if ("/email/send".equals(path)) { EmailVerificationService.send(uid(req),p.str("email"));ok(resp,null);return; }
        if ("/email/verify".equals(path)) { long user=uid(req);EmailVerificationService.verify(user,p.str("code"));ok(resp,EmailVerificationService.status(user));return; }
        if ("/login".equals(path)) {
            User u = UserService.login(p.str("studentNo"), p.str("password"));
            HttpSession session = req.getSession(true);
            session.setAttribute("userId", u.id);
            session.setMaxInactiveInterval(2 * 60 * 60);
            String token = TokenUtil.issue(u.id);
            resp.addCookie(rememberCookie(token));
            // cookie 被浏览器拦掉时，前端可以改用这个头
            resp.setHeader("X-Token", token);
            // 响应体里再给一份，浏览器连本地存储都禁用时还能放在内存里用
            u.token = token;
            ok(resp, "登录成功", u);
            return;
        }
        if ("/logout".equals(path)) {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            resp.addCookie(rememberCookie(""));
            ok(resp, "已退出登录", null);
            return;
        }
        throw notFound();
    }

    /** 记住登录用的签名 cookie，退出时用同一条路径发一个空值覆盖 */
    private Cookie rememberCookie(String value) {
        Cookie c = new Cookie(TokenUtil.COOKIE_NAME, value);
        c.setPath("/");
        c.setHttpOnly(true);
        c.setMaxAge(value.isEmpty() ? 0 : TokenUtil.MAX_AGE_SECONDS);
        return c;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo() == null ? "/" : req.getPathInfo();
        if ("/settings".equals(path)) {
            String json = DBUtil.queryOne("SELECT json FROM user_settings WHERE user_id=?",
                    rs -> rs.getString(1), uid(req));
            ok(resp, java.util.Map.of("json", json == null ? "{}" : json));
            return;
        }
        if ("/email".equals(path)) { ok(resp,EmailVerificationService.status(uid(req)));return; }
        if ("/me".equals(path)) {
            ok(resp, UserService.profile(uid(req)));
            return;
        }
        List<String> s = segs(req);
        if (s.isEmpty()) {
            throw notFound();
        }
        // GET /api/user/{id}/credit —— 这个人的信用分变动明细
        if (s.size() >= 2 && "credit".equals(s.get(1))) {
            ok(resp, UserService.creditLog(segLong(s, 0)));
            return;
        }
        ok(resp, UserService.publicProfile(segLong(s, 0)));
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo() == null ? "/" : req.getPathInfo();
        if ("/settings".equals(path)) {
            long user = uid(req);
            String json = Params.of(req).str("json");
            if (json == null || json.length() > 8192) throw BizException.badRequest("设置数据格式无效或过长");
            try {
                var parsed = JsonUtil.MAPPER.readTree(json);
                if (parsed == null || !parsed.isObject()) throw BizException.badRequest("设置必须为 JSON 对象");
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                throw BizException.badRequest("设置必须为 JSON 对象");
            }
            DBUtil.update("INSERT INTO user_settings(user_id,json) VALUES(?,?) "
                    + "ON DUPLICATE KEY UPDATE json=VALUES(json)", user, json);
            ok(resp, null);
            return;
        }
        if ("/me".equals(path)) {
            Params p = Params.of(req);
            long me = uid(req);
            UserService.updateProfile(me, p.str("nickname"), p.str("college"), p.str("building"));
            ok(resp, "资料已更新", UserService.profile(me));
            return;
        }
        throw notFound();
    }
}
