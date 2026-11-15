package com.huanyiquan.dao;

import com.huanyiquan.common.Const;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Review;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 互评 DAO。 */
public final class ReviewDao {

    private static final DBUtil.RowMapper<Review> MAP = rs -> {
        Review r = new Review();
        r.id = rs.getLong("id");
        r.exchangeId = rs.getLong("exchange_id");
        r.fromUser = rs.getLong("from_user");
        r.toUser = rs.getLong("to_user");
        r.score = rs.getInt("score");
        r.content = rs.getString("content");
        r.createTime = rs.getObject("create_time", LocalDateTime.class);
        return r;
    };

    private ReviewDao() {
    }

    public static long insert(Connection c, Review r) {
        return DBUtil.insert(c,
                "INSERT INTO `review`(exchange_id,from_user,to_user,score,content,create_time)"
                        + " VALUES(?,?,?,?,?,?)",
                r.exchangeId, r.fromUser, r.toUser, r.score, r.content, LocalDateTime.now());
    }

    public static boolean exists(long exchangeId, long fromUser, long toUser) {
        return DBUtil.count("SELECT COUNT(*) FROM `review` WHERE exchange_id=? AND from_user=? AND to_user=?",
                exchangeId, fromUser, toUser) > 0;
    }

    /** 某人收到的评价 */
    public static List<Review> listByTarget(long toUser) {
        return DBUtil.query("SELECT r.*, u.nickname AS nick FROM `review` r"
                        + " JOIN `user` u ON u.id=r.from_user"
                        + " WHERE r.to_user=? ORDER BY r.id DESC LIMIT 50",
                rs -> {
                    Review r = MAP.map(rs);
                    r.fromNickname = rs.getString("nick");
                    return r;
                }, toUser);
    }

    public static Double avgScore(long toUser) {
        Double v = DBUtil.queryOne("SELECT ROUND(AVG(score),1) FROM `review` WHERE to_user=?",
                rs -> rs.getDouble(1), toUser);
        return v == null || v == 0.0d ? null : v;
    }

    public static long countByTarget(long toUser) {
        return DBUtil.count("SELECT COUNT(*) FROM `review` WHERE to_user=?", toUser);
    }

    /** 好评数（4-5 星），用来算好评率 */
    public static long countGood(long toUser) {
        return DBUtil.count("SELECT COUNT(*) FROM `review` WHERE to_user=? AND score>=4", toUser);
    }

    /**
     * 我参与完成、但还没评价对方的交换单。
     * 用户主页上的「评价 TA」和「我的」页里的待评价提醒都靠这个查。
     */
    public static List<Map<String, Object>> listPending(long userId) {
        return DBUtil.query(
                "SELECT e.id AS exchange_id, d2.user_id AS target_id, u.nickname, u.credit,"
                        + " gi.title AS give_title"
                        + " FROM `exchange` e"
                        + " JOIN exchange_detail d1 ON d1.exchange_id=e.id AND d1.user_id=?"
                        + " JOIN exchange_detail d2 ON d2.exchange_id=e.id AND d2.user_id<>?"
                        + " JOIN `user` u ON u.id=d2.user_id"
                        + " LEFT JOIN `item` gi ON gi.id=d1.give_item_id"
                        + " WHERE e.status=? AND NOT EXISTS (SELECT 1 FROM `review` r"
                        + "     WHERE r.exchange_id=e.id AND r.from_user=? AND r.to_user=d2.user_id)"
                        + " ORDER BY e.id DESC LIMIT 20",
                rs -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("exchangeId", rs.getLong("exchange_id"));
                    m.put("targetUserId", rs.getLong("target_id"));
                    m.put("nickname", rs.getString("nickname"));
                    m.put("credit", rs.getInt("credit"));
                    m.put("itemTitle", rs.getString("give_title"));
                    return m;
                }, userId, userId, Const.EX_DONE, userId);
    }
}
