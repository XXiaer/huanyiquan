package com.huanyiquan.servlet;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Params;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.db.DBUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class SocialServlet extends BaseServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> parts = segs(req);
        if (parts.isEmpty()) throw notFound();
        String kind = parts.get(0);
        Params params = Params.of(req);
        if ("users".equals(kind) && parts.size() == 1) {
            String q = params.str("q", "").trim();
            ok(resp, DBUtil.query("SELECT id,nickname,college,building,credit FROM user "
                    + "WHERE status=1 AND role=0 AND nickname LIKE ? ORDER BY id DESC LIMIT 50",
                    rs -> profile(rs), "%" + q + "%"));
            return;
        }
        long user = uid(req);
        if (parts.size() == 2 && "check".equals(parts.get(1))) {
            if ("favorite".equals(kind)) {
                ok(resp, Map.of("favorited", DBUtil.count("SELECT COUNT(*) FROM social_favorite WHERE user_id=? AND item_id=?",
                        user, requiredId(params, "itemId")) > 0));
            } else if ("follow".equals(kind)) {
                ok(resp, Map.of("following", DBUtil.count("SELECT COUNT(*) FROM social_follow WHERE user_id=? AND target_id=?",
                        user, requiredId(params, "userId")) > 0));
            } else throw notFound();
            return;
        }
        if (parts.size() != 1) throw notFound();
        switch (kind) {
            case "favorite": ok(resp, ItemDao.socialItems(user, false)); return;
            case "history": ok(resp, ItemDao.socialItems(user, true)); return;
            case "follow":
                ok(resp, DBUtil.query("SELECT u.id,u.nickname,u.college,u.building,u.credit FROM social_follow f "
                        + "JOIN user u ON u.id=f.target_id WHERE f.user_id=? AND u.status=1 "
                        + "ORDER BY f.created_at DESC,f.target_id DESC LIMIT 100", SocialServlet::profile, user));
                return;
            case "stats":
                ok(resp, Map.of("favorite", ItemDao.socialItemCount(user, false),
                        "history", ItemDao.socialItemCount(user, true),
                        "follow", DBUtil.count("SELECT COUNT(*) FROM social_follow f JOIN user u ON u.id=f.target_id WHERE f.user_id=? AND u.status=1", user),
                        "wish", DBUtil.count("SELECT COUNT(*) FROM wish_post WHERE user_id=? AND status=1", user)));
                return;
            case "market":
                // Standard listings are swaps and have no cash price to aggregate.
                ok(resp, List.of());
                return;
            default: throw notFound();
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> parts = segs(req);
        if (parts.size() != 1) throw notFound();
        long user = uid(req);
        Params params = Params.of(req);
        switch (parts.get(0)) {
            case "favorite": {
                long item = requiredId(params, "itemId");
                ok(resp, Map.of("favorited", DBUtil.tx(c -> {
                    DBUtil.queryOne(c, "SELECT id FROM user WHERE id=? FOR UPDATE", rs -> rs.getLong(1), user);
                    if (DBUtil.update(c, "DELETE FROM social_favorite WHERE user_id=? AND item_id=?", user, item) > 0) return false;
                    if (ItemDao.findById(c, item) == null) throw BizException.notFound("物品不存在");
                    DBUtil.update(c, "INSERT INTO social_favorite(user_id,item_id) VALUES(?,?)", user, item);
                    return true;
                })));
                return;
            }
            case "history": {
                long item = requiredId(params, "itemId");
                if (ItemDao.findById(item) == null) throw BizException.notFound("物品不存在");
                DBUtil.update("INSERT INTO social_history(user_id,item_id) VALUES(?,?) "
                        + "ON DUPLICATE KEY UPDATE viewed_at=CURRENT_TIMESTAMP", user, item);
                ok(resp, null);
                return;
            }
            case "follow": {
                long target = requiredId(params, "userId");
                if (target == user) throw BizException.badRequest("不能关注自己");
                ok(resp, Map.of("following", DBUtil.tx(c -> {
                    DBUtil.queryOne(c, "SELECT id FROM user WHERE id=? FOR UPDATE", rs -> rs.getLong(1), user);
                    if (DBUtil.update(c, "DELETE FROM social_follow WHERE user_id=? AND target_id=?", user, target) > 0) return false;
                    Long id = DBUtil.queryOne(c, "SELECT id FROM user WHERE id=? AND status=1 AND role=0", rs -> rs.getLong(1), target);
                    if (id == null) throw BizException.notFound("用户不存在");
                    DBUtil.update(c, "INSERT INTO social_follow(user_id,target_id) VALUES(?,?)", user, target);
                    return true;
                })));
                return;
            }
            case "refresh": {
                long item = requiredId(params, "itemId");
                DBUtil.tx(c -> {
                    Long id = DBUtil.queryOne(c, "SELECT id FROM item WHERE id=? AND owner_id=? AND deleted=0 AND status=1 FOR UPDATE",
                            rs -> rs.getLong(1), item, user);
                    if (id == null) throw BizException.badRequest("只能擦亮自己在架的物品");
                    Long done = DBUtil.queryOne(c, "SELECT item_id FROM social_refresh WHERE user_id=? AND item_id=? AND refreshed_on=CURRENT_DATE",
                            rs -> rs.getLong(1), user, item);
                    if (done != null) throw BizException.badRequest("今天已擦亮这件物品");
                    DBUtil.update(c, "INSERT INTO social_refresh VALUES(?,?,CURRENT_DATE) ON DUPLICATE KEY UPDATE refreshed_on=CURRENT_DATE", user, item);
                    DBUtil.update(c, "UPDATE item SET update_time=CURRENT_TIMESTAMP WHERE id=?", item);
                    return null;
                });
                ok(resp, null);
                return;
            }
            default: throw notFound();
        }
    }

    private static long requiredId(Params params, String key) {
        Long id = params.lng(key);
        if (id == null || id < 1) throw BizException.badRequest("缺少有效的 " + key);
        return id;
    }

    private static Map<String, Object> profile(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getLong("id"));
        row.put("nickname", rs.getString("nickname"));
        row.put("college", rs.getString("college"));
        row.put("building", rs.getString("building"));
        row.put("credit", rs.getInt("credit"));
        return row;
    }
}
