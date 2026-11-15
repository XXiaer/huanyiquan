package com.huanyiquan.servlet;

import com.huanyiquan.common.Params;
import com.huanyiquan.service.ExchangeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/** 交换单：我的单子、详情、确认、约面交、确认收货、取消。 */
public class ExchangeServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.isEmpty() || "mine".equals(segs.get(0))) {
            ok(resp, ExchangeService.mine(uid(req)));
            return;
        }
        ok(resp, ExchangeService.detail(uid(req), segLong(segs, 0)));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.size() < 2) {
            throw notFound();
        }
        long exchangeId = segLong(segs, 0);
        String action = segs.get(1);
        Params p = Params.of(req);

        if ("confirm".equals(action)) {
            ok(resp, ExchangeService.confirm(uid(req), exchangeId));
            return;
        }
        if ("done".equals(action)) {
            ok(resp, ExchangeService.done(uid(req), exchangeId));
            return;
        }
        if ("cancel".equals(action)) {
            ExchangeService.cancel(uid(req), exchangeId, p.str("reason"));
            ok(resp, "已取消，物品解锁回到在架", null);
            return;
        }
        throw notFound();
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.size() < 2 || !"place".equals(segs.get(1))) {
            throw notFound();
        }
        Params p = Params.of(req);
        ExchangeService.place(uid(req), segLong(segs, 0), p.str("place"), p.str("dealTime"));
        ok(resp, "面交点已更新", null);
    }
}
