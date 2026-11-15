package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.common.Result;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 所有接口类的父类：统一异常转返回体，统一取路径段和登录人。
 * 业务代码里只管抛 BizException，不写 try-catch。
 */
public abstract class BaseServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            req.setCharacterEncoding("UTF-8");
            super.service(req, resp);
        } catch (BizException e) {
            JsonUtil.write(resp, Result.fail(e.getCode(), e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.write(resp, Result.fail(Const.CODE_SERVER_ERROR, "服务异常，请稍后重试"));
        }
    }

    /** 把 /5/confirm 拆成 ["5","confirm"] */
    protected List<String> segs(HttpServletRequest req) {
        String p = req.getPathInfo();
        List<String> out = new ArrayList<>();
        if (p == null) {
            return out;
        }
        for (String s : p.split("/")) {
            if (!s.isEmpty()) {
                out.add(s);
            }
        }
        return out;
    }

    protected long segLong(List<String> segs, int index) {
        if (segs.size() <= index) {
            throw new BizException(400, "缺少路径参数");
        }
        try {
            return Long.parseLong(segs.get(index));
        } catch (NumberFormatException e) {
            throw new BizException(400, "路径参数必须是数字");
        }
    }

    protected long uid(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        Object o = session == null ? null : session.getAttribute("userId");
        if (o == null) {
            throw BizException.unauthorized("请先登录");
        }
        return ((Number) o).longValue();
    }

    protected Long uidOrNull(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        Object o = session == null ? null : session.getAttribute("userId");
        return o == null ? null : ((Number) o).longValue();
    }

    protected void ok(HttpServletResponse resp, Object data) throws IOException {
        JsonUtil.write(resp, Result.ok(data));
    }

    protected void ok(HttpServletResponse resp, String msg, Object data) throws IOException {
        JsonUtil.write(resp, Result.ok(msg, data));
    }

    protected BizException notFound() {
        return BizException.notFound("接口不存在，检查一下路径和方法");
    }
}
