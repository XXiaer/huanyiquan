package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/** 举报入口。 */
public class ReportServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Params p = Params.of(req);
        Long targetType = p.lng("targetType");
        Long targetId = p.lng("targetId");
        if (targetType == null || targetId == null) {
            throw new BizException(400, "targetType 和 targetId 都要传");
        }
        ok(resp, ReportService.create(uid(req), targetType.intValue(), targetId, p.str("reason")));
    }
}
