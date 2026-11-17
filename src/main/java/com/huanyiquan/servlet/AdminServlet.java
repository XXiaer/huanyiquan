package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.AdminService;
import com.huanyiquan.service.ExchangeService;
import com.huanyiquan.service.AuctionService;
import com.huanyiquan.service.ItemService;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.common.Const;
import com.huanyiquan.service.DemoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/** 运营后台：举报列表、处理举报、数据看板、造演示数据。 */
public class AdminServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.isEmpty()) {
            throw notFound();
        }
        if ("exchange-disputes".equals(segs.get(0))) {
            ok(resp, segs.size() == 1 ? ExchangeService.disputes() : ExchangeService.disputeDetail(segLong(segs, 1)));
            return;
        }
        if ("users".equals(segs.get(0))) { ok(resp, AdminService.users(Params.of(req).str("q"))); return; }
        if ("exchanges".equals(segs.get(0))) { ok(resp, AdminService.exchangeRecords()); return; }
        if ("activity".equals(segs.get(0))) { ok(resp, AdminService.activity()); return; }
        if ("auctions".equals(segs.get(0))) { ok(resp, AuctionService.adminList()); return; }
        if ("items".equals(segs.get(0))) { ok(resp, ItemDao.list(null,null,null,null,null,Const.ITEM_PENDING,0,100)); return; }
        if ("report".equals(segs.get(0))) {
            Params p = Params.of(req);
            ok(resp, AdminService.listReports(p.intOf("status", 0)));
            return;
        }
        if ("dashboard".equals(segs.get(0))) {
            ok(resp, AdminService.dashboard());
            return;
        }
        throw notFound();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.size() == 2 && "exchange-disputes".equals(segs.get(0))) {
            Params p = Params.of(req);
            ExchangeService.resolveDispute(uid(req), segLong(segs, 1), p.str("outcome"), p.str("note"));
            ok(resp, null);
            return;
        }
        if (segs.size() == 3 && "users".equals(segs.get(0))) {
            String action = segs.get(2);
            if ("ban".equals(action)) action = "suspend";
            if ("unban".equals(action)) action = "restore";
            AdminService.setUserStatus(uid(req), segLong(segs, 1), action);
            ok(resp, null);
            return;
        }
        if (segs.size() == 3 && "items".equals(segs.get(0)) && ("approve".equals(segs.get(2)) || "reject".equals(segs.get(2)))) { ItemService.review(uid(req),segLong(segs,1),"approve".equals(segs.get(2))); ok(resp,null); return; }
        if (segs.size() == 3 && "auctions".equals(segs.get(0)) && ("approve".equals(segs.get(2)) || "reject".equals(segs.get(2)))) { AuctionService.review(segLong(segs,1),"approve".equals(segs.get(2))); ok(resp,null); return; }
        if (segs.size() == 3 && "auctions".equals(segs.get(0)) && "cancel".equals(segs.get(2))) { AuctionService.cancel(segLong(segs, 1)); ok(resp, null); return; }
        if (segs.size() >= 2 && "report".equals(segs.get(0)) && "handle".equals(segs.get(1))) {
            Params p = Params.of(req);
            Long reportId = p.lng("reportId");
            if (reportId == null) {
                throw new BizException(400, "reportId 不能为空");
            }
            ok(resp, AdminService.handleReport(uid(req), reportId, p.str("action"), p.str("note")));
            return;
        }
        if (segs.size() >= 2 && "demo".equals(segs.get(0)) && "reset".equals(segs.get(1))) {
            ok(resp, "演示数据已重置", DemoService.reset());
            return;
        }
        if (!segs.isEmpty() && "demo".equals(segs.get(0))) {
            ok(resp, "演示数据已就绪", DemoService.seed());
            return;
        }
        throw notFound();
    }
}
