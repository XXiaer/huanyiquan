package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.service.AiVisionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * AI 识图估价与扫码识物搜索接口：/api/ai/*
 */
public class AiServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> segs = segs(req);
        Params p = Params.of(req);
        if (segs.size() == 1 && "appraise".equals(segs.get(0))) {
            String image = p.str("image");
            String category = p.str("category");
            String condition = p.str("condition");
            String title = p.str("title");
            int orig = p.intOf("origPrice", 0);
            ok(resp, AiVisionService.appraise(image, category, condition, orig > 0 ? orig : null, title));
            return;
        }
        if (segs.size() == 1 && "scan-search".equals(segs.get(0))) {
            String image = p.str("image");
            ok(resp, AiVisionService.identifyKeyword(image));
            return;
        }
        throw new BizException(404, "未知的 AI 接口");
    }
}
