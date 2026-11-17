package com.huanyiquan.dao;

import com.huanyiquan.common.Const;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Offer;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** 报价单 DAO。 */
public final class OfferDao {

    private static final String JOIN_SELECT =
            "SELECT o.*, ti.title AS t_title, mi.title AS m_title, ex.id AS exchange_id,"
                    + " fu.nickname AS f_nick, fu.credit AS f_credit, tu.nickname AS t_nick"
                    + " FROM `offers` o"
                    + " JOIN `item` ti ON ti.id=o.item_id"
                    + " LEFT JOIN `item` mi ON mi.id=o.my_item_id"
                    + " LEFT JOIN `exchange` ex ON ex.offer_id=o.id"
                    + " JOIN `user` fu ON fu.id=o.from_user"
                    + " JOIN `user` tu ON tu.id=o.to_user ";

    private static final DBUtil.RowMapper<Offer> LIST_MAP = rs -> {
        Offer o = base(rs);
        o.targetTitle = rs.getString("t_title");
        o.myTitle = rs.getString("m_title");
        o.fromNickname = rs.getString("f_nick");
        o.fromCredit = rs.getInt("f_credit");
        o.toNickname = rs.getString("t_nick");
        return o;
    };

    private OfferDao() {
    }

    static Offer base(ResultSet rs) throws SQLException {
        Offer o = new Offer();
        o.id = rs.getLong("id");
        o.itemId = rs.getLong("item_id");
        o.myItemId = rs.getObject("my_item_id", Long.class);
        o.amountCents = rs.getObject("amount_cents", Long.class);
        o.conversationId = rs.getObject("conversation_id", Long.class);
        o.exchangeId = rs.getObject("exchange_id", Long.class);
        o.fromUser = rs.getLong("from_user");
        o.toUser = rs.getLong("to_user");
        o.message = rs.getString("message");
        o.status = rs.getInt("status");
        long parentId = rs.getLong("parent_id");
        o.parentId = rs.wasNull() ? null : parentId;
        long rootId = rs.getLong("root_offer_id");
        o.rootOfferId = rs.wasNull() ? null : rootId;
        o.targetTitleSnap = rs.getString("target_title_snap");
        o.targetThumbSnap = rs.getString("target_thumb_snap");
        o.targetCondSnap = rs.getString("target_cond_snap");
        o.myTitleSnap = rs.getString("my_title_snap");
        o.myThumbSnap = rs.getString("my_thumb_snap");
        o.myCondSnap = rs.getString("my_cond_snap");
        o.expireTime = rs.getObject("expire_time", LocalDateTime.class);
        o.createTime = rs.getObject("create_time", LocalDateTime.class);
        o.handleTime = rs.getObject("handle_time", LocalDateTime.class);
        o.statusText = Const.offerStatusText(o.status == null ? 0 : o.status);
        return o;
    }

    public static long insert(Connection c, Offer o) {
        return DBUtil.insert(c,
                "INSERT INTO `offers`(item_id,my_item_id,from_user,to_user,message,status,parent_id,root_offer_id,"
                        + "target_title_snap,target_thumb_snap,target_cond_snap,my_title_snap,my_thumb_snap,my_cond_snap,"
                        + "expire_time,create_time,amount_cents,conversation_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                o.itemId, o.myItemId, o.fromUser, o.toUser, o.message, o.status, o.parentId, o.rootOfferId,
                o.targetTitleSnap, o.targetThumbSnap, o.targetCondSnap, o.myTitleSnap, o.myThumbSnap, o.myCondSnap,
                o.expireTime, LocalDateTime.now(), o.amountCents, o.conversationId);
    }

    public static void setRootOfferId(Connection c, long id, long rootOfferId) {
        DBUtil.update(c, "UPDATE `offers` SET root_offer_id=? WHERE id=?", rootOfferId, id);
    }

    public static List<Offer> listThread(long rootOfferId) {
        return DBUtil.query(JOIN_SELECT + " WHERE (o.root_offer_id=? OR o.id=?) ORDER BY o.id ASC",
                LIST_MAP, rootOfferId, rootOfferId);
    }

    public static Long latestIdInThread(Connection c, long rootOfferId) {
        return DBUtil.queryOne(c,
                "SELECT MAX(id) FROM `offers` WHERE root_offer_id=? OR id=?",
                rs -> {
                    long v = rs.getLong(1);
                    return rs.wasNull() ? null : v;
                },
                rootOfferId, rootOfferId);
    }

    public static Offer findById(long id) {
        return DBUtil.queryOne(JOIN_SELECT + " WHERE o.id=?", LIST_MAP, id);
    }

    public static Offer latestForConversation(long conversationId) {
        return DBUtil.queryOne(JOIN_SELECT + " WHERE o.conversation_id=? ORDER BY o.id DESC LIMIT 1",
                LIST_MAP, conversationId);
    }

    public static boolean hasPending(Connection c, long conversationId, long itemId, long user, long owner) {
        return DBUtil.count(c, "SELECT COUNT(*) FROM offers WHERE status=? AND expire_time>=NOW()"
                        + " AND (conversation_id=? OR (conversation_id IS NULL AND item_id=? AND from_user=? AND to_user=?))",
                Const.OFFER_PENDING, conversationId, itemId, user, owner) > 0;
    }

    /** 在事务内锁定单条报价，返回当前状态用于防并发重复处理 */
    public static Integer lockStatus(Connection c, long id) {
        return DBUtil.queryOne(c, "SELECT status FROM `offers` WHERE id=? FOR UPDATE",
                rs -> rs.getInt(1), id);
    }

    public static List<Offer> listReceived(long userId, Integer status) {
        StringBuilder sql = new StringBuilder(JOIN_SELECT).append(" WHERE o.to_user=?");
        List<Object> args = new ArrayList<>();
        args.add(userId);
        if (status != null) {
            sql.append(" AND o.status=?");
            args.add(status);
        }
        sql.append(" ORDER BY o.create_time DESC LIMIT 100");
        return DBUtil.query(sql.toString(), LIST_MAP, args.toArray());
    }

    public static List<Offer> listSent(long userId) {
        return DBUtil.query(JOIN_SELECT + " WHERE o.from_user=? ORDER BY o.create_time DESC LIMIT 100",
                LIST_MAP, userId);
    }

    public static void updateStatus(Connection c, long id, int status) {
        DBUtil.update(c, "UPDATE `offers` SET status=?, handle_time=? WHERE id=?",
                status, LocalDateTime.now(), id);
    }

    /** 定时任务：把过期的待响应报价改成已失效 */
    public static int expireAll() {
        return DBUtil.update("UPDATE `offers` SET status=?, handle_time=?"
                + " WHERE status=? AND expire_time < ?",
                Const.OFFER_EXPIRED, LocalDateTime.now(), Const.OFFER_PENDING, LocalDateTime.now());
    }

    /** 某件物品成交后，其他待响应报价自动失效 */
    public static void invalidateByItems(Connection c, Long itemA, Long itemB) {
        DBUtil.update(c, "UPDATE `offers` SET status=?, handle_time=?"
                        + " WHERE status=? AND (item_id IN (?,?) OR my_item_id IN (?,?))",
                Const.OFFER_EXPIRED, LocalDateTime.now(), Const.OFFER_PENDING,
                itemA, itemB, itemA, itemB);
    }
}
