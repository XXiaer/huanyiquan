package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

public final class FollowersServlet extends BaseServlet {
    private static final long serialVersionUID = 1L;

    private boolean usesLiveFollowTable() {
        return DBUtil.count("SELECT COUNT(*) FROM information_schema.tables "
                + "WHERE table_schema=DATABASE() AND table_name='follow'") > 0;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        long userId = uid(req);
        boolean followers = req.getServletPath().endsWith("/followers");
        boolean live = usesLiveFollowTable();
        String table = live ? "`follow`" : "social_follow";
        String from = live ? "from_user" : "user_id";
        String to = live ? "to_user" : "target_id";
        String join = followers ? from : to;
        String owner = followers ? to : from;
        String order = live ? "f.id DESC" : "f.created_at DESC,u.id DESC";
        ok(resp, DBUtil.query("SELECT u.id,u.nickname,u.college,u.building,u.credit"
                + (live ? ",u.avatar" : "") + " FROM " + table + " f "
                + "JOIN user u ON u.id=f." + join + " WHERE f." + owner
                + "=? AND u.status=1 AND u.deleted=0 ORDER BY " + order,
                rs -> {
                    Map<String, Object> user = new LinkedHashMap<>();
                    user.put("id", rs.getLong("id"));
                    user.put("nickname", rs.getString("nickname"));
                    user.put("college", rs.getString("college"));
                    user.put("building", rs.getString("building"));
                    user.put("credit", rs.getInt("credit"));
                    if (live) user.put("avatar", rs.getString("avatar"));
                    return user;
                }, userId));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!req.getServletPath().endsWith("/follow")) throw notFound();
        long actor = uid(req);
        Long target = Params.of(req).lng("userId");
        if (target == null || target < 1 || target == actor) throw BizException.badRequest("请选择其他同学");
        boolean live = usesLiveFollowTable();
        String table = live ? "`follow`" : "social_follow";
        String from = live ? "from_user" : "user_id";
        String to = live ? "to_user" : "target_id";
        boolean following = DBUtil.tx(c -> {
            String nickname = DBUtil.queryOne(c, "SELECT nickname FROM user WHERE id=? FOR UPDATE", rs -> rs.getString(1), actor);
            if (DBUtil.update(c, "DELETE FROM " + table + " WHERE " + from + "=? AND " + to + "=?", actor, target) > 0) return false;
            Long active = DBUtil.queryOne(c, "SELECT id FROM user WHERE id=? AND status=1 AND deleted=0", rs -> rs.getLong(1), target);
            if (active == null || nickname == null) throw BizException.notFound("用户不存在");
            DBUtil.update(c, "INSERT INTO " + table + "(" + from + "," + to + ") VALUES(?,?)", actor, target);
            NotificationService.send(c, target, "有同学关注了你", nickname + "关注了你", "#/followers");
            return true;
        });
        ok(resp, Map.of("following", following));
    }
}

