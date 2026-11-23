package com.huanyiquan.servlet;

import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.common.Result;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;

/**
 * 静态页面托管。把 web/ 目录前端直接挂到根路径，前后端同源，
 * session cookie 直接生效，不用配跨域代理。
 *
 * 映射到 "/"（默认 Servlet），/api/* 的精确匹配优先级更高，不会被打到这里。
 */
public class StaticServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final String[] SPA_ENTRY = {"index.html"};

    private File root;

    /** war 部署时用这个构造，root 取 webapp 根目录 */
    public StaticServlet() {
    }

    /** 内嵌运行时直接指定 web 目录 */
    public StaticServlet(File root) {
        this.root = root;
    }

    @Override
    public void init() {
        if (root == null) {
            String real = getServletContext().getRealPath("/");
            root = real == null ? new File("src/main/webapp") : new File(real);
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();
        String ctx = req.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            uri = uri.substring(ctx.length());
        }
        if (uri.startsWith("/api/")) {
            sendNotFound(resp, "接口不存在");
            return;
        }
        // 我们自己写的静态托管没有容器那层保护，必须手动挡住 WEB-INF
        String upper = uri.toUpperCase();
        if (upper.startsWith("/WEB-INF") || upper.startsWith("/META-INF")) {
            sendNotFound(resp, "页面不存在");
            return;
        }

        if (PageRoutes.matches(uri)) {
            File entry = new File(root, PageRoutes.entry(req, uri));
            if (!entry.isFile()) {
                sendNotFound(resp, "页面不存在");
                return;
            }
            resp.setHeader("Vary", "User-Agent, Sec-CH-UA-Mobile");
            writeFile(entry, resp);
            return;
        }

        File file = resolve(uri);
        if (file != null && file.isDirectory()) {
            File dirIndex = new File(file, SPA_ENTRY[0]);
            if (dirIndex.isFile()) {
                if (!uri.endsWith("/")) {
                    String prefix = (ctx == null) ? "" : ctx;
                    String query = req.getQueryString();
                    String target = prefix + uri + "/" + (query != null && !query.isEmpty() ? "?" + query : "");
                    resp.sendRedirect(target);
                    return;
                }
                file = dirIndex;
            }
        }
        if (file == null || !file.isFile()) {
            sendNotFound(resp, "页面不存在");
            return;
        }
        writeFile(file, resp);
    }

    private void sendNotFound(HttpServletResponse resp, String msg) throws IOException {
        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        resp.setContentType("application/json;charset=UTF-8");
        JsonUtil.MAPPER.writeValue(resp.getOutputStream(), Result.fail(404, msg));
    }

    private File resolve(String uri) throws IOException {
        if (uri == null || uri.isEmpty() || "/".equals(uri)) {
            return new File(root, SPA_ENTRY[0]);
        }
        String relative = uri.startsWith("/") ? uri.substring(1) : uri;
        if (relative.contains("..")) {
            return null;
        }
        try {
            Path rootPath = root.toPath().toAbsolutePath().normalize();
            Path target = rootPath.resolve(relative).normalize();
            if (!target.startsWith(rootPath)) {
                return null;
            }
            return target.toFile();
        } catch (InvalidPathException e) {
            return null;
        }
    }

    private void writeFile(File file, HttpServletResponse resp) throws IOException {
        resp.setContentType(mime(file.getName()));
        resp.setContentLengthLong(file.length());
        // html / js / css 不缓存，避免改完代码前端还跑旧版本；图片这类给一点缓存
        String lower = file.getName().toLowerCase();
        boolean text = lower.endsWith(".html") || lower.endsWith(".htm")
                || lower.endsWith(".js") || lower.endsWith(".css");
        resp.setHeader("Cache-Control", text ? "no-cache, must-revalidate" : "public, max-age=300");
        try (OutputStream out = resp.getOutputStream();
             InputStream in = Files.newInputStream(file.toPath())) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            out.flush();
        }
    }

    private String mime(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".html") || n.endsWith(".htm")) {
            return "text/html;charset=UTF-8";
        }
        if (n.endsWith(".css")) {
            return "text/css;charset=UTF-8";
        }
        if (n.endsWith(".js")) {
            return "application/javascript;charset=UTF-8";
        }
        if (n.endsWith(".json")) {
            return "application/json;charset=UTF-8";
        }
        if (n.endsWith(".svg")) {
            return "image/svg+xml";
        }
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".webm")) return "video/webm";
        if (n.endsWith(".wav")) return "audio/wav";
        if (n.endsWith(".png")) {
            return "image/png";
        }
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (n.endsWith(".ico")) {
            return "image/x-icon";
        }
        if (n.endsWith(".woff2")) {
            return "font/woff2";
        }
        return "application/octet-stream";
    }
}
