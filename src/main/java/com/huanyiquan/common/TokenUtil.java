package com.huanyiquan.common;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Properties;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * 登录凭证。
 *
 * session 存在内存里，服务一重启就没了，登录状态跟着丢。这里额外发一个签名 cookie，
 * session 找不到时用它把 session 重新建起来，重启后不用重新登录。
 *
 * 结构：userId.expireAtMillis.签名，签名是 HmacSHA256(前两段, app.secret)。
 * 只签用户 id 和过期时间，不放任何隐私字段。
 */
public final class TokenUtil {

    public static final String COOKIE_NAME = "hq_token";
    /** 7 天 */
    public static final int MAX_AGE_SECONDS = 7 * 24 * 3600;

    private static final String SECRET = loadSecret();

    private TokenUtil() {
    }

    private static String loadSecret() {
        Properties p = new Properties();
        try (InputStream in = TokenUtil.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in != null) {
                p.load(in);
            }
        } catch (Exception ignore) {
            // 读不到就用默认值，保证本地能跑
        }
        String s = System.getenv("APP_SECRET");
        if (s != null && !s.trim().isEmpty()) {
            return s.trim();
        }
        s = p.getProperty("app.secret");
        if (s == null || s.trim().isEmpty()) {
            System.err.println("[WARN] 未配置 APP_SECRET，当前使用本地默认签名密钥，生产环境请务必设置强随机 APP_SECRET");
            return "huanyiquan-local-secret";
        }
        return s.trim();
    }

    /** 签发：userId + 过期时间戳 + 签名 */
    public static String issue(long userId) {
        long expireAt = System.currentTimeMillis() + MAX_AGE_SECONDS * 1000L;
        String payload = userId + "." + expireAt;
        return payload + "." + sign(payload);
    }

    /** 校验：签名对、没过期才返回 userId，否则返回 null */
    public static Long verify(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        String payload = parts[0] + "." + parts[1];
        if (!sign(payload).equals(parts[2])) {
            return null;
        }
        try {
            long expireAt = Long.parseLong(parts[1]);
            if (System.currentTimeMillis() > expireAt) {
                return null;
            }
            return Long.parseLong(parts[0]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) {
            throw new IllegalStateException("签名单据失败", e);
        }
    }
}
