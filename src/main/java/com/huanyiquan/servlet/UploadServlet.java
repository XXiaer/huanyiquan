package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 图片上传与读取。
 * 只收 jpg / png，≤2MB，服务端重命名，库里只存路径。
 * 上传目录在运行目录下的 uploads，禁止执行权限（文件名全部重写为随机的英文数字）。
 */
public class UploadServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;
    private static final Set<String> ALLOWED = new HashSet<>(Arrays.asList("jpg", "jpeg", "png"));
    private static final int THUMBNAIL_SIZE = 480;
    private static final long MAX_SIZE = 2L * 1024 * 1024;

    private static File uploadDir() {
        File dir = new File("uploads");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new BizException(500, "创建上传目录失败");
        }
        return dir;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        uid(req);
        Part part;
        try {
            part = req.getPart("file");
        } catch (Exception e) {
            throw new BizException(400, "读取上传文件失败，确认表单字段名是 file");
        }
        if (part == null || part.getSize() <= 0) {
            throw new BizException(400, "没有收到文件");
        }
        if (part.getSize() > MAX_SIZE) {
            throw new BizException(400, "图片不能超过 2MB");
        }
        String ext = ext(part.getSubmittedFileName());
        if (!ALLOWED.contains(ext)) {
            throw new BizException(400, "只支持 jpg 和 png 格式");
        }
        byte[] bytes;
        try (InputStream in = part.getInputStream()) {
            bytes = in.readNBytes((int) MAX_SIZE + 1);
        } catch (IOException e) {
            throw new BizException(500, "读取上传文件失败");
        }
        if (bytes.length == 0) {
            throw new BizException(400, "没有收到文件内容");
        }
        if (bytes.length > MAX_SIZE) {
            throw new BizException(400, "图片不能超过 2MB");
        }
        String detectedExt = detectImageExt(bytes);
        if (detectedExt == null) {
            throw new BizException(400, "文件内容不是有效的 JPG 或 PNG 图片");
        }
        String finalExt = "png".equals(detectedExt) ? "png" : ("jpeg".equals(ext) ? "jpeg" : "jpg");
        String newName = UUID.randomUUID().toString().replace("-", "") + "." + finalExt;
        File target = new File(uploadDir(), newName);
        try {
            Files.write(target.toPath(), bytes);
        } catch (IOException e) {
            throw new BizException(500, "保存图片失败");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("url", "/api/file/" + newName);
        data.put("name", newName);
        ok(resp, "上传成功", data);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path == null || path.length() < 2) {
            throw BizException.notFound("文件不存在");
        }
        String name = path.substring(1);
        if (!name.matches("^[A-Za-z0-9][A-Za-z0-9_-]*\\.(jpg|jpeg|png)$")) {
            throw BizException.forbidden("非法文件名");
        }
        File file = new File(uploadDir(), name);
        if (!file.exists()) {
            throw BizException.notFound("图片不存在");
        }
        // 过滤器统一设了 UTF-8 编码，二进流要把它从 Content-Type 里摘掉
        File thumbnail = "1".equals(req.getParameter("thumb")) ? thumbnail(file) : null;
        if (thumbnail != null) file = thumbnail;
        resp.setHeader("Cache-Control", "public, max-age=3600");
        String mime = thumbnail == null && name.endsWith(".png") ? "image/png" : "image/jpeg";
        resp.setContentType(mime);
        resp.setHeader("Content-Type", mime);
        resp.setContentLengthLong(file.length());
        try (OutputStream out = resp.getOutputStream(); InputStream in = Files.newInputStream(file.toPath())) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            out.flush();
        }
    }

    private File thumbnail(File source) {
        Path directory = source.toPath().getParent().resolve(".thumbnails");
        Path cached = directory.resolve(source.getName() + ".jpg");
        Path temporary = null;
        try {
            if (Files.isRegularFile(cached) && Files.getLastModifiedTime(cached).toMillis() >= source.lastModified()) {
                return cached.toFile();
            }
            try (ImageInputStream stream = ImageIO.createImageInputStream(source)) {
                if (stream == null) return null;
                Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
                if (!readers.hasNext()) return null;
                ImageReader reader = readers.next();
                try {
                    reader.setInput(stream, true, true);
                    int width = reader.getWidth(0);
                    int height = reader.getHeight(0);
                    int longest = Math.max(width, height);
                    if ((long) width * height > 16_000_000L || (longest <= THUMBNAIL_SIZE && source.length() <= 64 * 1024)) return null;
                    var params = reader.getDefaultReadParam();
                    int sample = Math.max(1, longest / THUMBNAIL_SIZE);
                    params.setSourceSubsampling(sample, sample, 0, 0);
                    BufferedImage original = reader.read(0, params);
                    double scale = Math.min(1, (double) THUMBNAIL_SIZE / longest);
                    int w = Math.max(1, (int) Math.round(width * scale));
                    int h = Math.max(1, (int) Math.round(height * scale));
                    BufferedImage preview = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
                    Graphics2D graphics = preview.createGraphics();
                    try {
                        graphics.setColor(Color.WHITE);
                        graphics.fillRect(0, 0, w, h);
                        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                        graphics.drawImage(original, 0, 0, w, h, null);
                    } finally {
                        graphics.dispose();
                    }
                    Files.createDirectories(directory);
                    temporary = Files.createTempFile(directory, "thumb-", ".jpg");
                    if (!ImageIO.write(preview, "jpg", temporary.toFile()) || Files.size(temporary) >= source.length()) return null;
                    Files.move(temporary, cached, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
                    return cached.toFile();
                } finally {
                    reader.dispose();
                }
            }
        } catch (IOException | RuntimeException ignored) {
            return null;
        } finally {
            if (temporary != null) {
                try { Files.deleteIfExists(temporary); } catch (IOException ignored) { }
            }
        }
    }

    private static String detectImageExt(byte[] bytes) {
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && (bytes[4] & 0xFF) == 0x0D
                && (bytes[5] & 0xFF) == 0x0A
                && (bytes[6] & 0xFF) == 0x1A
                && (bytes[7] & 0xFF) == 0x0A) {
            return "png";
        }
        return null;
    }

    private String ext(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1).toLowerCase();
    }
}
