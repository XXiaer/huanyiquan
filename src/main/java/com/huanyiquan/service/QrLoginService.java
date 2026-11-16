package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.entity.User;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 桌面端扫码登录状态机（支持真实二维码 + 6 位数字配对短码）。
 *
 * 状态流转：PENDING -> SCANNED -> CONFIRMED / CANCELLED -> EXCHANGED(原子销毁)
 */
public final class QrLoginService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SCANNED = "SCANNED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_EXPIRED = "EXPIRED";

    private static final long TTL_MS = 180_000L;
    private static final int MAX_SESSIONS = 10_000;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern QR_PARAM = Pattern.compile("[?&#]qr=([A-Za-z0-9_-]{12,64})");

    private static final ConcurrentHashMap<String, QrSession> SESSIONS = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, String> PAIR_INDEX = new ConcurrentHashMap<>();
    private static volatile long lastCleanupAt = 0L;

    public static final class QrSession {
        public final String qrId;
        public final String pollSecret;
        public final String pairCode;
        public final String clientIp;
        public final String deviceHint;
        public final long expireAt;
        public volatile String status = STATUS_PENDING;
        public volatile Long userId;
        public volatile String nickname;

        QrSession(String qrId, String pollSecret, String pairCode, String clientIp, String deviceHint, long expireAt) {
            this.qrId = qrId;
            this.pollSecret = pollSecret;
            this.pairCode = pairCode;
            this.clientIp = clientIp;
            this.deviceHint = deviceHint;
            this.expireAt = expireAt;
        }
    }

    private QrLoginService() {
    }

    public static Map<String, Object> create(String ip, String userAgent) {
        long now = System.currentTimeMillis();
        cleanup(now);
        if (SESSIONS.size() >= MAX_SESSIONS) {
            SESSIONS.clear();
            PAIR_INDEX.clear();
        }

        String qrId = randomToken(18);
        String pollSecret = randomToken(24);
        String pairCode = allocPairCode();
        String hint = parseDeviceHint(userAgent);

        QrSession session = new QrSession(qrId, pollSecret, pairCode, ip, hint, now + TTL_MS);
        SESSIONS.put(qrId, session);
        PAIR_INDEX.put(pairCode, qrId);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("qrId", qrId);
        out.put("pollSecret", pollSecret);
        out.put("pairCode", pairCode);
        out.put("expiresIn", (int) (TTL_MS / 1000L));
        return out;
    }

    public static Map<String, Object> status(String qrId, String pollSecret) {
        QrSession s = getActive(qrId);
        if (s == null) {
            Map<String, Object> exp = new LinkedHashMap<>();
            exp.put("status", STATUS_EXPIRED);
            exp.put("expiresLeft", 0);
            return exp;
        }
        if (pollSecret == null || !s.pollSecret.equals(pollSecret)) {
            throw BizException.forbidden("无效的轮询凭证");
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", s.status);
        res.put("expiresLeft", Math.max(0, (int) ((s.expireAt - System.currentTimeMillis()) / 1000L)));
        if (s.nickname != null) {
            res.put("nickname", s.nickname);
        }
        return res;
    }

    public static Map<String, Object> scan(long userId, String rawInput) {
        User u = UserDao.findById(userId);
        if (u == null || u.status == null || u.status != 1) {
            throw BizException.forbidden("当前账号状态异常，无法授权登录");
        }
        String qrId = resolveQrId(rawInput);
        QrSession s = getActive(qrId);
        if (s == null) {
            throw BizException.badRequest("二维码已失效或不存在，请刷新桌面端二维码后重试");
        }
        synchronized (s) {
            if (STATUS_CANCELLED.equals(s.status) || STATUS_CONFIRMED.equals(s.status)) {
                throw BizException.badRequest("该二维码已被使用，请刷新桌面端二维码");
            }
            if (STATUS_SCANNED.equals(s.status) && s.userId != null && !s.userId.equals(userId)) {
                throw BizException.badRequest("该二维码已被其他手机端扫描");
            }
            s.status = STATUS_SCANNED;
            s.userId = userId;
            s.nickname = u.nickname;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("qrId", s.qrId);
        out.put("status", s.status);
        out.put("nickname", u.nickname);
        out.put("deviceHint", s.deviceHint);
        out.put("clientIp", maskIp(s.clientIp));
        return out;
    }

    public static Map<String, Object> confirm(long userId, String qrId, String action) {
        QrSession s = getActive(qrId);
        if (s == null) {
            throw BizException.badRequest("二维码已过期，请重新扫码");
        }
        User u = UserDao.findById(userId);
        if (u == null || u.status == null || u.status != 1) {
            throw BizException.forbidden("账号已被封禁或不存在");
        }
        boolean isCancel = "cancel".equalsIgnoreCase(action);
        synchronized (s) {
            if (s.userId != null && !s.userId.equals(userId)) {
                throw BizException.forbidden("无权操作他人扫描的登录请求");
            }
            if (STATUS_CONFIRMED.equals(s.status) || STATUS_CANCELLED.equals(s.status)) {
                throw BizException.badRequest("该扫码请求已处理");
            }
            s.userId = userId;
            s.nickname = u.nickname;
            s.status = isCancel ? STATUS_CANCELLED : STATUS_CONFIRMED;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("qrId", s.qrId);
        out.put("status", s.status);
        return out;
    }

    public static User exchange(String qrId, String pollSecret) {
        if (qrId == null || qrId.trim().isEmpty()) {
            throw BizException.badRequest("缺少二维码凭证");
        }
        QrSession s = SESSIONS.get(qrId.trim());
        if (s == null || s.expireAt < System.currentTimeMillis()) {
            SESSIONS.remove(qrId.trim());
            throw BizException.badRequest("二维码已过期，请刷新重扫");
        }
        if (pollSecret == null || !s.pollSecret.equals(pollSecret)) {
            throw BizException.forbidden("轮询凭证校验失败");
        }
        synchronized (s) {
            if (!STATUS_CONFIRMED.equals(s.status) || s.userId == null) {
                throw BizException.badRequest("手机端尚未确认登录");
            }
            SESSIONS.remove(s.qrId);
            PAIR_INDEX.remove(s.pairCode);
        }
        User u = UserService.profile(s.userId);
        if (u.status == null || u.status != 1) {
            throw BizException.forbidden("账号已被封禁");
        }
        return u;
    }

    private static QrSession getActive(String qrId) {
        if (qrId == null || qrId.trim().isEmpty()) {
            return null;
        }
        QrSession s = SESSIONS.get(qrId.trim());
        if (s == null) {
            return null;
        }
        if (s.expireAt < System.currentTimeMillis()) {
            SESSIONS.remove(s.qrId);
            PAIR_INDEX.remove(s.pairCode);
            return null;
        }
        return s;
    }

    public static String resolveQrId(String raw) {
        if (raw == null) return "";
        String t = raw.trim();
        if (t.matches("[0-9]{6}")) {
            String mapped = PAIR_INDEX.get(t);
            return mapped == null ? "" : mapped;
        }
        try {
            t = URLDecoder.decode(t, StandardCharsets.UTF_8);
        } catch (Exception ignore) {
        }
        Matcher m = QR_PARAM.matcher(t);
        if (m.find()) {
            return m.group(1);
        }
        if (t.startsWith("HYQ_QR:")) {
            return t.substring("HYQ_QR:".length()).trim();
        }
        return t;
    }

    private static String allocPairCode() {
        for (int i = 0; i < 16; i++) {
            String code = String.format("%06d", RANDOM.nextInt(1_000_000));
            if (!PAIR_INDEX.containsKey(code)) {
                return code;
            }
        }
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private static String randomToken(int bytesLen) {
        byte[] b = new byte[bytesLen];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String parseDeviceHint(String ua) {
        if (ua == null || ua.isEmpty()) return "桌面端网页浏览器";
        String u = ua.toLowerCase();
        String browser = u.contains("edg") ? "Edge" : (u.contains("chrome") ? "Chrome" : (u.contains("firefox") ? "Firefox" : (u.contains("safari") ? "Safari" : "浏览器")));
        String os = u.contains("windows") ? "Windows" : (u.contains("mac os") ? "macOS" : (u.contains("linux") ? "Linux" : "桌面设备"));
        return os + " · " + browser;
    }

    private static String maskIp(String ip) {
        if (ip == null || ip.isEmpty()) return "未知网络";
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".*." + parts[3];
        }
        return ip.length() > 12 ? ip.substring(0, 12) + "..." : ip;
    }

    private static void cleanup(long now) {
        if (now - lastCleanupAt < 30_000L && SESSIONS.size() < 2000) {
            return;
        }
        lastCleanupAt = now;
        Iterator<Map.Entry<String, QrSession>> it = SESSIONS.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, QrSession> e = it.next();
            if (e.getValue().expireAt < now) {
                PAIR_INDEX.remove(e.getValue().pairCode);
                it.remove();
            }
        }
    }
}
