package com.huanyiquan.service;

import com.huanyiquan.common.BizException;

import javax.imageio.ImageIO;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.Area;
import java.awt.geom.Ellipse2D;
import java.awt.geom.GeneralPath;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 滑块拼图人机验证服务（零系统字体依赖，纯几何栅格生成）。
 *
 * 流程：
 *   1. createChallenge(ip) 生成背景图与拼图滑块 PNG，答案仅存服务端内存并在 120s 后过期；
 *   2. verifySlider(...) 一次性消费 captchaId，核验坐标偏差与轨迹耗时后签发一次性 captchaToken；
 *   3. consumeTicket(ip, captchaToken) 在登录/发信/注册接口执行前一次性核销票据。
 */
public final class CaptchaService {

    static {
        System.setProperty("java.awt.headless", "true");
    }

    public static final int BG_WIDTH = 300;
    public static final int BG_HEIGHT = 150;
    private static final int PIECE_CORE = 44;
    private static final int TAB_R = 8;
    public static final int SPRITE_SIZE = PIECE_CORE + TAB_R * 2; // 60x60

    private static final long CHALLENGE_TTL_MS = 120_000L;
    private static final long TICKET_TTL_MS = 90_000L;
    private static final int MAX_ENTRIES = 10_000;
    private static final int TOLERANCE_PX = 6;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final ConcurrentHashMap<String, Challenge> CHALLENGES = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, Ticket> TICKETS = new ConcurrentHashMap<>();
    private static volatile long lastCleanupAt = 0L;

    private static final class Challenge {
        final int expectedLeft;
        final String ip;
        final long expireAt;

        Challenge(int expectedLeft, String ip, long expireAt) {
            this.expectedLeft = expectedLeft;
            this.ip = ip;
            this.expireAt = expireAt;
        }
    }

    private static final class Ticket {
        final String ip;
        final long expireAt;

        Ticket(String ip, long expireAt) {
            this.ip = ip;
            this.expireAt = expireAt;
        }
    }

    private CaptchaService() {
    }

    public static Map<String, Object> createChallenge(String ip) {
        long now = System.currentTimeMillis();
        cleanup(now);
        if (CHALLENGES.size() >= MAX_ENTRIES) {
            CHALLENGES.clear();
        }

        int coreX = 96 + RANDOM.nextInt(132); // 96..227 => expectedLeft 88..219
        int coreY = 24 + RANDOM.nextInt(58);  // 24..81  => topY 16..73
        int expectedLeft = coreX - TAB_R;
        int topY = coreY - TAB_R;

        BufferedImage scene = renderScene();
        Shape puzzleShape = buildPuzzleShape(coreX, coreY, RANDOM.nextBoolean(), RANDOM.nextBoolean());
        BufferedImage piece = extractPiece(scene, puzzleShape, expectedLeft, topY);
        carveHole(scene, puzzleShape);

        String captchaId = UUID.randomUUID().toString().replace("-", "");
        CHALLENGES.put(captchaId, new Challenge(expectedLeft, safeIp(ip), now + CHALLENGE_TTL_MS));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("captchaId", captchaId);
        out.put("bgImage", toDataUrl(scene));
        out.put("pieceImage", toDataUrl(piece));
        out.put("y", topY);
        out.put("width", BG_WIDTH);
        out.put("height", BG_HEIGHT);
        out.put("pieceSize", SPRITE_SIZE);
        return out;
    }

    public static Map<String, Object> verifySlider(String ip, String captchaId, Integer offsetX,
                                                   Long durationMs, List<?> tracks) {
        if (captchaId == null || captchaId.trim().isEmpty()) {
            throw BizException.badRequest("验证已失效，请刷新拼图重试");
        }
        Challenge c = CHALLENGES.remove(captchaId.trim());
        long now = System.currentTimeMillis();
        if (c == null || c.expireAt < now || !c.ip.equals(safeIp(ip))) {
            throw BizException.badRequest("验证已过期，请刷新拼图重试");
        }
        if (offsetX == null || Math.abs(offsetX - c.expectedLeft) > TOLERANCE_PX) {
            throw BizException.badRequest("拼图位置有偏差，请重试");
        }
        long dur = durationMs == null ? 0L : durationMs;
        if (dur < 160L || dur > 45_000L) {
            throw BizException.badRequest("拖动速度异常，请重新拖动完成验证");
        }
        if (tracks == null || tracks.size() < 4 || !validTracks(tracks, offsetX)) {
            throw BizException.badRequest("操作轨迹异常，请重新拖动完成验证");
        }

        if (TICKETS.size() >= MAX_ENTRIES) {
            TICKETS.clear();
        }
        byte[] raw = new byte[24];
        RANDOM.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        TICKETS.put(token, new Ticket(safeIp(ip), now + TICKET_TTL_MS));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("captchaToken", token);
        res.put("expiresIn", (int) (TICKET_TTL_MS / 1000L));
        return res;
    }

    public static void consumeTicket(String ip, String captchaToken) {
        if (captchaToken == null || captchaToken.trim().isEmpty()) {
            throw BizException.badRequest("请先完成安全拼图验证");
        }
        Ticket ticket = TICKETS.remove(captchaToken.trim());
        long now = System.currentTimeMillis();
        if (ticket == null || ticket.expireAt < now || !ticket.ip.equals(safeIp(ip))) {
            throw BizException.badRequest("人机验证已过期或失效，请重新验证");
        }
    }

    private static boolean validTracks(List<?> tracks, int finalOffset) {
        int lastX = Integer.MIN_VALUE;
        int minX = Integer.MAX_VALUE;
        int maxX = Integer.MIN_VALUE;
        for (Object item : tracks) {
            if (!(item instanceof List)) {
                continue;
            }
            List<?> pt = (List<?>) item;
            if (pt.size() < 2) {
                continue;
            }
            int x = toInt(pt.get(0));
            lastX = x;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
        }
        if (lastX == Integer.MIN_VALUE) {
            return false;
        }
        return (maxX - minX) >= 20 && Math.abs(lastX - finalOffset) <= 8;
    }

    private static int toInt(Object o) {
        if (o instanceof Number) {
            return ((Number) o).intValue();
        }
        try {
            return (int) Math.round(Double.parseDouble(String.valueOf(o)));
        } catch (Exception e) {
            return 0;
        }
    }

    private static String safeIp(String ip) {
        return ip == null ? "unknown" : ip.trim();
    }

    private static void cleanup(long now) {
        if (now - lastCleanupAt < 30_000L && CHALLENGES.size() < 2000 && TICKETS.size() < 2000) {
            return;
        }
        lastCleanupAt = now;
        pruneMap(CHALLENGES, now);
        pruneTickets(now);
    }

    private static void pruneMap(ConcurrentHashMap<String, Challenge> map, long now) {
        Iterator<Map.Entry<String, Challenge>> it = map.entrySet().iterator();
        while (it.hasNext()) {
            if (it.next().getValue().expireAt < now) {
                it.remove();
            }
        }
    }

    private static void pruneTickets(long now) {
        Iterator<Map.Entry<String, Ticket>> it = TICKETS.entrySet().iterator();
        while (it.hasNext()) {
            if (it.next().getValue().expireAt < now) {
                it.remove();
            }
        }
    }

    // ------------------------------------------------------------------ 图像渲染

    private static final Color[][] PALETTES = {
            {new Color(12, 114, 99), new Color(25, 165, 143), new Color(243, 168, 71)},
            {new Color(19, 45, 70), new Color(36, 123, 123), new Color(255, 184, 108)},
            {new Color(22, 92, 82), new Color(72, 175, 152), new Color(252, 211, 141)},
            {new Color(32, 64, 81), new Color(59, 105, 120), new Color(132, 169, 172)}
    };

    private static BufferedImage renderScene() {
        BufferedImage img = new BufferedImage(BG_WIDTH, BG_HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        Color[] p = PALETTES[RANDOM.nextInt(PALETTES.length)];
        g.setPaint(new GradientPaint(0, 0, p[0], BG_WIDTH, BG_HEIGHT, p[1]));
        g.fillRect(0, 0, BG_WIDTH, BG_HEIGHT);

        // 太阳/光晕
        int sunX = 35 + RANDOM.nextInt(220);
        int sunY = 18 + RANDOM.nextInt(45);
        g.setColor(new Color(p[2].getRed(), p[2].getGreen(), p[2].getBlue(), 190));
        g.fillOval(sunX, sunY, 34, 34);
        g.setColor(new Color(255, 255, 255, 45));
        g.fillOval(sunX - 10, sunY - 10, 54, 54);

        // 远景几何山丘 / 校园剪影
        drawHill(g, 90 + RANDOM.nextInt(20), new Color(255, 255, 255, 34));
        drawHill(g, 112 + RANDOM.nextInt(16), new Color(10, 38, 34, 72));

        // 随机校园积木建筑剪影增强纹理
        int bx = 12 + RANDOM.nextInt(20);
        while (bx < BG_WIDTH - 20) {
            int bw = 18 + RANDOM.nextInt(26);
            int bh = 22 + RANDOM.nextInt(42);
            int by = BG_HEIGHT - bh;
            g.setColor(new Color(14, 42, 38, 95 + RANDOM.nextInt(45)));
            g.fill(new RoundRectangle2D.Double(bx, by, bw, bh + 6, 4, 4));
            g.setColor(new Color(255, 255, 255, 55));
            for (int wy = by + 6; wy < BG_HEIGHT - 8; wy += 9) {
                for (int wx = bx + 4; wx < bx + bw - 5; wx += 7) {
                    if (RANDOM.nextBoolean()) {
                        g.fillRect(wx, wy, 3, 4);
                    }
                }
            }
            bx += bw + 4 + RANDOM.nextInt(14);
        }

        // 散景圆点与贝塞尔线条干扰
        for (int i = 0; i < 14; i++) {
            int r = 10 + RANDOM.nextInt(28);
            int x = RANDOM.nextInt(BG_WIDTH) - r / 2;
            int y = RANDOM.nextInt(BG_HEIGHT) - r / 2;
            g.setColor(new Color(255, 255, 255, 18 + RANDOM.nextInt(30)));
            g.fillOval(x, y, r, r);
        }
        g.setStroke(new BasicStroke(1.3f));
        for (int i = 0; i < 5; i++) {
            g.setColor(new Color(255, 255, 255, 38));
            GeneralPath curve = new GeneralPath();
            curve.moveTo(0, RANDOM.nextInt(BG_HEIGHT));
            curve.curveTo(80 + RANDOM.nextInt(40), RANDOM.nextInt(BG_HEIGHT),
                    170 + RANDOM.nextInt(50), RANDOM.nextInt(BG_HEIGHT),
                    BG_WIDTH, RANDOM.nextInt(BG_HEIGHT));
            g.draw(curve);
        }
        g.dispose();
        return img;
    }

    private static void drawHill(Graphics2D g, int baseY, Color color) {
        GeneralPath path = new GeneralPath();
        path.moveTo(0, BG_HEIGHT);
        path.lineTo(0, baseY);
        path.quadTo(75, baseY - 26 - RANDOM.nextInt(18), 155, baseY + 4);
        path.quadTo(230, baseY + 22, BG_WIDTH, baseY - 12 - RANDOM.nextInt(16));
        path.lineTo(BG_WIDTH, BG_HEIGHT);
        path.closePath();
        g.setColor(color);
        g.fill(path);
    }

    private static Shape buildPuzzleShape(int x, int y, boolean topOut, boolean rightOut) {
        Area area = new Area(new RoundRectangle2D.Double(x, y, PIECE_CORE, PIECE_CORE, 6, 6));
        double d = TAB_R * 2.0;
        double midX = x + PIECE_CORE / 2.0 - TAB_R;
        double midY = y + PIECE_CORE / 2.0 - TAB_R;

        // 上方凸出或凹进
        Area topTab = new Area(new Ellipse2D.Double(midX, topOut ? y - TAB_R : y - TAB_R + 2, d, d));
        if (topOut) area.add(topTab);
        else area.subtract(new Area(new Ellipse2D.Double(midX, y - TAB_R + 1, d, d)));

        // 右侧凸出或凹进
        Area rightTab = new Area(new Ellipse2D.Double(rightOut ? x + PIECE_CORE - TAB_R : x + PIECE_CORE - TAB_R - 2, midY, d, d));
        if (rightOut) area.add(rightTab);
        else area.subtract(new Area(new Ellipse2D.Double(x + PIECE_CORE - TAB_R - 1, midY, d, d)));

        // 左侧固定小凹槽增强轮廓特征
        area.subtract(new Area(new Ellipse2D.Double(x - TAB_R + 1, midY, d, d)));
        return area;
    }

    private static BufferedImage extractPiece(BufferedImage scene, Shape worldShape, int offsetX, int offsetY) {
        BufferedImage piece = new BufferedImage(SPRITE_SIZE, SPRITE_SIZE, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = piece.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        g.translate(-offsetX, -offsetY);
        g.setClip(worldShape);
        g.drawImage(scene, 0, 0, null);
        g.setClip(null);

        // 滑块亮边与阴影描边，立体清晰
        g.setStroke(new BasicStroke(2.2f));
        g.setColor(new Color(0, 0, 0, 120));
        g.draw(worldShape);
        g.setStroke(new BasicStroke(1.3f));
        g.setColor(new Color(255, 255, 255, 235));
        g.draw(worldShape);
        g.dispose();
        return piece;
    }

    private static void carveHole(BufferedImage scene, Shape worldShape) {
        Graphics2D g = scene.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setComposite(AlphaComposite.SrcOver);
        g.setColor(new Color(10, 24, 22, 168));
        g.fill(worldShape);
        g.setStroke(new BasicStroke(1.5f));
        g.setColor(new Color(255, 255, 255, 165));
        g.draw(worldShape);
        g.dispose();
    }

    private static String toDataUrl(BufferedImage img) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            throw new IllegalStateException("验证码生成失败", e);
        }
    }
}
