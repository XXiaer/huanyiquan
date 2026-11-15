package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/** 互评：提交评价、查看某人收到的评价。 */
public class ReviewServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (!segs.isEmpty()) {
            throw notFound();
        }
        Params p = Params.of(req);
        Long exchangeId = p.lng("exchangeId");
        Long targetUserId = p.lng("targetUserId");
        if (exchangeId == null || targetUserId == null) {
            throw new BizException(400, "exchangeId 和 targetUserId 都要传");
        }
        ok(resp, ReviewService.create(uid(req), exchangeId, targetUserId,
                p.intOf("score", null), p.str("content")));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        if (segs.size() >= 1 && "pending".equals(segs.get(0))) {
            ok(resp, ReviewService.pending(uid(req)));
            return;
        }
        if (segs.size() >= 2 && "user".equals(segs.get(0))) {
            ok(resp, ReviewService.listByUser(segLong(segs, 1)));
            return;
        }
        throw notFound();
    }
}
