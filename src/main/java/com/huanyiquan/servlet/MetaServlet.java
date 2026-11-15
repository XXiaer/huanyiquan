package com.huanyiquan.servlet;

import com.huanyiquan.db.DBUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 连通性探测。不需要登录，登录页靠它显示"后端 / 数据库"到底通没通。
 * 只做只读查询，失败也要正常返回，方便前端区分是哪一层断的。
 */
public class MetaServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo() == null ? "/" : req.getPathInfo();
        if (!"/status".equals(path)) {
            throw notFound();
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("server", "ok");
        data.put("version", "v2.0");
        data.put("time", LocalDateTime.now().toString().replace('T', ' ').substring(0, 19));

        try {
            long onShelf = DBUtil.count("SELECT COUNT(*) FROM `item` WHERE status=1 AND deleted=0");
            long users = DBUtil.count("SELECT COUNT(*) FROM `user` WHERE deleted=0");
            data.put("db", true);
            data.put("onShelf", onShelf);
            data.put("users", users);
        } catch (Exception e) {
            data.put("db", false);
            data.put("dbError", "数据库连接异常");
        }
        ok(resp, data);
    }
}
