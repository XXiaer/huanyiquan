package com.huanyiquan.filter;

import com.huanyiquan.common.Const;
import com.huanyiquan.common.JsonUtil;
import com.huanyiquan.common.Result;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.entity.User;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/** 后台接口的角色二次校验。非管理员一律 403，不给任何提示性信息。 */
public class AdminFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        HttpSession session = req.getSession(false);
        Object userId = session == null ? null : session.getAttribute("userId");
        if (userId == null) {
            JsonUtil.write(resp, Result.fail(Const.CODE_UNAUTHORIZED, "请先登录"));
            return;
        }
        User u = UserDao.findById(((Number) userId).longValue());
        if (u == null || u.role == null || u.role != 1) {
            JsonUtil.write(resp, Result.fail(Const.CODE_FORBIDDEN, "只有管理员能进后台"));
            return;
        }
        chain.doFilter(request, response);
    }
}
