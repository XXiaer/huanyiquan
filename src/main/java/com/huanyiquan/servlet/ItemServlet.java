package com.huanyiquan.servlet;

import com.huanyiquan.common.Const;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.ItemService;
import com.huanyiquan.service.SemanticSearchService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/** 物品：发布、列表、详情、我的物品、编辑、上下架。 */
public class ItemServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (!segs.isEmpty()) {
            throw notFound();
        }
        Params p = Params.of(req);
        Integer allowBargainInt = p.intOf("allowBargain", null);
        long itemId = ItemService.create(uid(req),
                p.str("title"),
                p.str("category"),
                p.str("conditionLevel", p.str("condition")),
                p.str("description"),
                p.str("images"),
                p.str("expectDesc"),
                p.str("wantCategory"),
                p.lng("wantItemId"),
                p.str("matchMode"),
                p.intOf("price", null),
                p.intOf("originalPrice", null),
                p.intOf("tradeMode", null),
                p.str("place"),
                p.str("wantText"),
                p.str("brand"),
                p.str("delivery"),
                allowBargainInt == null ? null : allowBargainInt != 0);
        ok(resp, "已提交审核", java.util.Collections.singletonMap("itemId", itemId));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.isEmpty() || "list".equals(segs.get(0))) {
            Params p = Params.of(req);
            ok(resp, ItemService.list(
                    p.str("category"),
                    p.str("conditionLevel", p.str("condition")),
                    p.str("building"),
                    p.str("keyword"),
                    p.intOf("tradeMode", null),
                    p.str("sort"),
                    p.intOf("page", 1),
                    p.intOf("size", 20)));
            return;
        }
        if ("deals".equals(segs.get(0))) { ok(resp, ItemDao.recentDeals(Params.of(req).intOf("size", 8))); return; }
        if ("search".equals(segs.get(0))) { Params p=Params.of(req); ok(resp,SemanticSearchService.search(p.str("q"),p.str("category"),p.str("conditionLevel"),p.intOf("page",1),p.intOf("size",20))); return; }
        if ("mine".equals(segs.get(0))) {
            Params p = Params.of(req);
            Integer status = p.intOf("status", null);
            ok(resp, ItemService.mine(uid(req), status));
            return;
        }
        // GET /api/item/user/{id} —— 某人主页上的在架物品
        if ("user".equals(segs.get(0)) && segs.size() >= 2) {
            ok(resp, ItemService.listByOwner(segLong(segs, 1)));
            return;
        }
        ok(resp, ItemService.detail(uidOrNull(req), segLong(segs, 0)));
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.isEmpty()) {
            throw notFound();
        }
        long itemId = segLong(segs, 0);
        Params p = Params.of(req);

        // 只传 status 就是上下架，传其他字段就是编辑
        if (p.has("status") && !p.has("title")) {
            Integer status = p.intOf("status", Const.ITEM_ON);
            ItemService.changeStatus(uid(req), itemId, status == null ? Const.ITEM_ON : status);
            boolean on = status != null && status == Const.ITEM_ON;
            ok(resp, on ? "已提交审核" : "已下架", null);
            return;
        }
        Integer allowBargainInt = p.intOf("allowBargain", null);
        ItemService.update(uid(req), itemId,
                p.str("title"),
                p.str("category"),
                p.str("conditionLevel", p.str("condition")),
                p.str("description"),
                p.str("images"),
                p.str("expectDesc"),
                p.str("wantCategory"),
                p.lng("wantItemId"),
                p.str("matchMode"),
                p.intOf("price", null),
                p.intOf("originalPrice", null),
                p.intOf("tradeMode", null),
                p.str("place"),
                p.str("wantText"),
                p.str("brand"),
                p.str("delivery"),
                allowBargainInt == null ? null : allowBargainInt != 0);
        ok(resp, "已保存", null);
    }
}
