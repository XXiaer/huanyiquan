package com.huanyiquan.dao;

import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.CycleEdge;
import com.huanyiquan.entity.Intent;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 意向表 DAO。环匹配的三次查询全在这里。
 * 匹配口径：一件物品的意向命中另一件物品，只要「指定的具体物品相同」或「类别相同」就算命中。
 */
public final class IntentDao {

    private static final DBUtil.RowMapper<Intent> MAP = rs -> {
        Intent i = new Intent();
        i.id = rs.getLong("id");
        i.userId = rs.getLong("user_id");
        i.itemId = rs.getLong("item_id");
        i.wantCategory = rs.getString("want_category");
        long wantItemId = rs.getLong("want_item_id");
        i.wantItemId = rs.wasNull() ? null : wantItemId;
        i.createTime = rs.getObject("create_time", LocalDateTime.class);
        return i;
    };

    private IntentDao() {
    }

    public static long insert(Connection c, Intent i) {
        return DBUtil.insert(c,
                "INSERT INTO `intent`(user_id,item_id,want_category,want_item_id,create_time) VALUES(?,?,?,?,?)",
                i.userId, i.itemId, i.wantCategory, i.wantItemId, LocalDateTime.now());
    }

    public static Intent findByItemId(long itemId) {
        return DBUtil.queryOne("SELECT * FROM `intent` WHERE item_id=? ORDER BY id DESC LIMIT 1", MAP, itemId);
    }

    public static List<Intent> findAllByItemId(long itemId) { return DBUtil.query("SELECT * FROM `intent` WHERE item_id=? ORDER BY id", MAP, itemId); }

    public static void deleteByItemId(Connection c, long itemId) {
        DBUtil.update(c, "DELETE FROM `intent` WHERE item_id=?", itemId);
    }

    /**
     * 第一次查询：谁想要我这件物品。返回的每一条，都是「某人手里那件想拿出来换」。
     */
    public static List<CycleEdge> findWanters(long myItemId, String myCategory, long excludeUserId) {
        StringBuilder sql = new StringBuilder(
                "SELECT DISTINCT i.user_id AS uid, i.item_id AS iid FROM `intent` i"
                        + " JOIN `item` it ON it.id=i.item_id AND it.deleted=0 AND it.status=1 AND it.allow_cycle=1 AND it.is_demo=0"
                        + " JOIN `user` u ON u.id=i.user_id AND u.status=1 AND u.credit>=60"
                        + " WHERE it.owner_id<>? AND (i.want_item_id=?");
        List<Object> args = new ArrayList<>();
        args.add(excludeUserId);
        args.add(myItemId);
        if (myCategory != null && !myCategory.trim().isEmpty()) {
            sql.append(" OR (i.want_item_id IS NULL AND i.want_category=?)");
            args.add(myCategory);
        }
        sql.append(")");
        sql.append(" ORDER BY iid DESC LIMIT 200");
        return DBUtil.query(sql.toString(),
                rs -> {
                    CycleEdge e = new CycleEdge();
                    e.userId = rs.getLong("uid");
                    e.itemId = rs.getLong("iid");
                    return e;
                }, args.toArray());
    }

    /**
     * 环的第三条边：这个人「用自己那件 giveItemId」是不是想要 targetItemId。
     * 查得比只查 user_id 更严格，避免拿到他别的物品的意向凑数。
     */
    public static boolean wantsWithItem(long userId, long giveItemId, long targetItemId, String targetCategory) {
        if (targetCategory == null || targetCategory.trim().isEmpty()) {
            return DBUtil.count("SELECT COUNT(*) FROM `intent` WHERE user_id=? AND item_id=?"
                    + " AND want_item_id=?", userId, giveItemId, targetItemId) > 0;
        }
        return DBUtil.count("SELECT COUNT(*) FROM `intent` WHERE user_id=? AND item_id=?"
                        + " AND (want_item_id=? OR (want_item_id IS NULL AND want_category=?))",
                userId, giveItemId, targetItemId, targetCategory) > 0;
    }
}
