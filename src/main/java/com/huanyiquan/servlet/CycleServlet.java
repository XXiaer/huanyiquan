package com.huanyiquan.servlet;

import com.huanyiquan.common.Params;
import com.huanyiquan.service.CycleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/** 三方换物环：找环、成环。 */
public class CycleServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.isEmpty()) {
            throw notFound();
        }
        long itemId = segLong(segs, 0);
        List<Map<String, Object>> list = CycleService.find(uid(req), itemId);
        if (list.isEmpty()) {
            ok(resp, "暂时没有找到能成环的换法。可以再发布一件物品，或者等别人补上新意向", list);
            return;
        }
        ok(resp, list);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.size() < 2 || !"create".equals(segs.get(1))) {
            throw notFound();
        }
        long itemId = segLong(segs, 0);
        Params p = Params.of(req);
        List<Long> itemIds = p.longList("itemIds");
        long exchangeId = CycleService.createRing(uid(req), itemId, itemIds);
        ok(resp, "环成了，三方各确认一次就能约面交",
                Collections.singletonMap("exchangeId", exchangeId));
    }
}
