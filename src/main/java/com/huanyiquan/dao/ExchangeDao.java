package com.huanyiquan.dao;

import com.huanyiquan.common.Const;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Exchange;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

/** 交换单主表 DAO。 */
public final class ExchangeDao {

    private static final String EXCHANGE_SELECT = "SELECT e.*,o.amount_cents AS cash_amount,"
            + " CASE WHEN o.amount_cents IS NULL THEN NULL WHEN o.from_user=i.owner_id THEN o.to_user"
            + " ELSE o.from_user END AS cash_buyer, u.nickname AS closer"
            + " FROM `exchange` e LEFT JOIN offers o ON o.id=e.offer_id"
            + " LEFT JOIN item i ON i.id=o.item_id LEFT JOIN `user` u ON u.id=e.closed_by";

    private static final DBUtil.RowMapper<Exchange> MAP = rs -> {
        Exchange e = base(rs);
        return e;
    };

    private ExchangeDao() {
    }

    static Exchange base(ResultSet rs) throws SQLException {
        Exchange e = new Exchange();
        e.id = rs.getLong("id");
        e.type = rs.getInt("type");
        e.status = rs.getInt("status");
        e.place = rs.getString("place");
        e.dealTime = rs.getString("deal_time");
        long offerId = rs.getLong("offer_id");
        e.offerId = rs.wasNull() ? null : offerId;
        long confArr = rs.getLong("confirmed_arrangement_id");
        e.confirmedArrangementId = rs.wasNull() ? null : confArr;
        long pendArr = rs.getLong("pending_arrangement_id");
        e.pendingArrangementId = rs.wasNull() ? null : pendArr;
        e.createTime = rs.getObject("create_time", LocalDateTime.class);
        e.finishTime = rs.getObject("finish_time", LocalDateTime.class);
        e.closedBy = rs.getObject("closed_by", Long.class);
        e.closedByName = rs.getString("closer");
        e.amountCents = rs.getObject("cash_amount", Long.class);
        e.cashBuyerId = rs.getObject("cash_buyer", Long.class);
        if (e.type == 3 && e.status == Const.EX_WAIT_CONFIRM && e.createTime != null) {
            e.confirmExpiresAt = e.createTime.plusHours(Const.CONFIRM_EXPIRE_HOURS);
        }
        e.statusText = Const.exchangeStatusText(e.status == null ? 0 : e.status);
        return e;
    }

    public static long insert(Connection c, Exchange e) {
        return DBUtil.insert(c,
                "INSERT INTO `exchange`(type,status,place,deal_time,offer_id,create_time)"
                        + " VALUES(?,?,?,?,?,?)",
                e.type, e.status, e.place, e.dealTime, e.offerId, LocalDateTime.now());
    }

    public static Exchange findById(long id) {
        return DBUtil.queryOne(EXCHANGE_SELECT + " WHERE e.id=?", MAP, id);
    }

    public static void updateStatus(long id, int status) {
        DBUtil.update("UPDATE `exchange` SET status=? WHERE id=?", status, id);
    }

    public static void updateStatus(Connection c, long id, int status) {
        DBUtil.update(c, "UPDATE `exchange` SET status=? WHERE id=?", status, id);
    }

    /** 收尾：状态 + 完成时间一起写 */
    public static void close(Connection c, long id, int status) {
        DBUtil.update(c, "UPDATE `exchange` SET status=?, finish_time=? WHERE id=?",
                status, LocalDateTime.now(), id);
    }

    public static void updatePlace(long id, String place, String dealTime) {
        DBUtil.update("UPDATE `exchange` SET place=?, deal_time=? WHERE id=?", place, dealTime, id);
    }

    public static List<Exchange> listByUser(long userId) {
        return DBUtil.query(EXCHANGE_SELECT + " JOIN `exchange_detail` d ON d.exchange_id=e.id"
                + " WHERE d.user_id=? ORDER BY e.id DESC LIMIT 50", MAP, userId);
    }

    /** 定时清扫用：某个状态下、创建时间早于给定时点的单子 */
    public static List<Exchange> listExpired(int status, LocalDateTime before) {
        return DBUtil.query(EXCHANGE_SELECT + " WHERE e.status=? AND e.create_time < ?",
                MAP, status, before);
    }

    public static long countByStatus(int status) {
        return DBUtil.count("SELECT COUNT(*) FROM `exchange` WHERE status=?", status);
    }

    public static long countByType(Integer type) {
        if (type == null) {
            return DBUtil.count("SELECT COUNT(*) FROM `exchange`");
        }
        return DBUtil.count("SELECT COUNT(*) FROM `exchange` WHERE type=?", type);
    }

    public static long countByTypeAndStatus(int type, int status) {
        return DBUtil.count("SELECT COUNT(*) FROM `exchange` WHERE type=? AND status=?", type, status);
    }
}
