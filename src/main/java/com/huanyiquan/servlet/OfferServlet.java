package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.OfferService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/** 报价：发起、收到的、发出的、接受/拒绝/还价/撤回。 */
public class OfferServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        Params p = Params.of(req);

        if (segs.isEmpty()) {
            Long itemId = p.lng("itemId");
            Long myItemId = p.lng("myItemId");
            if (itemId == null || myItemId == null) {
                throw new BizException(400, "itemId 和 myItemId 都要传");
            }
            long offerId = OfferService.create(uid(req), itemId, myItemId, p.str("message"));
            ok(resp, "已发出报价，等对方回应", Collections.singletonMap("offerId", offerId));
            return;
        }
        if ("handle".equals(segs.get(0))) {
            Long offerId = p.lng("offerId");
            if (offerId == null) {
                throw new BizException(400, "offerId 不能为空");
            }
            ok(resp, OfferService.handle(uid(req), offerId, p.str("action"), p.lng("myItemId")));
            return;
        }
        throw notFound();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (!segs.isEmpty() && "received".equals(segs.get(0))) {
            Params p = Params.of(req);
            ok(resp, OfferService.received(uid(req), p.intOf("status", null)));
            return;
        }
        if (!segs.isEmpty() && "sent".equals(segs.get(0))) {
            ok(resp, OfferService.sent(uid(req)));
            return;
        }
        throw notFound();
    }
}
