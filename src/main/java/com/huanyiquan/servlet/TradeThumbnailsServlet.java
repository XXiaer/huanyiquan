package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.db.DBUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public final class TradeThumbnailsServlet extends BaseServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        long userId = uid(req);
        String ids = Params.of(req).str("ids", "");
        if (!ids.matches("[1-9][0-9]{0,17}(,[1-9][0-9]{0,17}){0,39}")) {
            throw BizException.badRequest("物品编号无效");
        }
        String[] values = ids.split(",");
        var parameters = new ArrayList<Object>();
        for (String value : values) parameters.add(Long.valueOf(value));
        parameters.add(userId);
        String placeholders = String.join(",", Collections.nCopies(values.length, "?"));
        Map<Long, String> images = new LinkedHashMap<>();
        DBUtil.query("SELECT id,images FROM item WHERE deleted=0 AND id IN (" + placeholders
                + ") AND (status NOT IN (5,6) OR owner_id=?)", rs -> {
                    String pictures = rs.getString("images");
                    if (pictures != null && !pictures.isBlank()) {
                        images.put(rs.getLong("id"), pictures.split(",", 2)[0].trim());
                    }
                    return rs.getLong("id");
                }, parameters.toArray());
        ok(resp, images);
    }
}

