package com.huanyiquan.servlet;

import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.filter.SecurityFilter;
import com.huanyiquan.service.CaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 滑块拼图人机验证接口：
 *   GET  /api/captcha/new     签发一次性拼图挑战
 *   POST /api/captcha/verify  核验拖动坐标与轨迹并签发一次性凭证
 */
public class CaptchaServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if ("/api/captcha/new".equals(req.getServletPath())) {
            ok(resp, CaptchaService.createChallenge(SecurityFilter.clientIp(req)));
            return;
        }
        throw notFound();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if ("/api/captcha/verify".equals(req.getServletPath())) {
            Map<String, Object> body = JsonUtil.bodyMap(req);
            String captchaId = body.get("captchaId") == null ? null : String.valueOf(body.get("captchaId"));
            Integer offsetX = toInt(body.get("offsetX"));
            Long durationMs = toLong(body.get("durationMs"));
            List<?> tracks = body.get("tracks") instanceof List ? (List<?>) body.get("tracks") : null;
            ok(resp, CaptchaService.verifySlider(SecurityFilter.clientIp(req), captchaId, offsetX, durationMs, tracks));
            return;
        }
        throw notFound();
    }

    private static Integer toInt(Object v) {
        if (v instanceof Number) return ((Number) v).intValue();
        try { return v == null ? null : Integer.valueOf(String.valueOf(v).trim()); }
        catch (Exception e) { return null; }
    }

    private static Long toLong(Object v) {
        if (v instanceof Number) return ((Number) v).longValue();
        try { return v == null ? null : Long.valueOf(String.valueOf(v).trim()); }
        catch (Exception e) { return null; }
    }
}
