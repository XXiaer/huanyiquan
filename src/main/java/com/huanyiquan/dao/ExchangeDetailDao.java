package com.huanyiquan.dao;

import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.ExchangeDetail;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

/** 交换单明细 DAO。 */
public final class ExchangeDetailDao {

    private static final DBUtil.RowMapper<ExchangeDetail> MAP = rs -> base(rs);

    private static final DBUtil.RowMapper<ExchangeDetail> JOIN_MAP = rs -> {
        ExchangeDetail d = base(rs);
        d.nickname = rs.getString("nick");
        d.building = rs.getString("build");
        d.giveTitle = rs.getString("give_title");
        d.getTitle = rs.getString("get_title");
        return d;
    };

    private ExchangeDetailDao() {
    }

    static ExchangeDetail base(ResultSet rs) throws SQLException {
        ExchangeDetail d = new ExchangeDetail();
        d.id = rs.getLong("id");
        d.exchangeId = rs.getLong("exchange_id");
        d.userId = rs.getLong("user_id");
        d.giveItemId = rs.getLong("give_item_id");
        d.getItemId = rs.getLong("get_item_id");
        d.confirmed = rs.getInt("confirmed");
        d.delivered = rs.getInt("delivered");
        d.confirmTime = rs.getObject("confirm_time", LocalDateTime.class);
        d.deliverTime = rs.getObject("deliver_time", LocalDateTime.class);
        return d;
    }

    public static long insert(Connection c, ExchangeDetail d) {
        return DBUtil.insert(c,
                "INSERT INTO `exchange_detail`(exchange_id,user_id,give_item_id,get_item_id,confirmed,delivered)"
                        + " VALUES(?,?,?,?,0,0)",
                d.exchangeId, d.userId, d.giveItemId, d.getItemId);
    }

    public static List<ExchangeDetail> listByExchange(long exchangeId) {
        return DBUtil.query("SELECT d.*, u.nickname AS nick, u.building AS build,"
                        + " gi.title AS give_title, gt.title AS get_title"
                        + " FROM `exchange_detail` d"
                        + " JOIN `user` u ON u.id=d.user_id"
                        + " JOIN `item` gi ON gi.id=d.give_item_id"
                        + " JOIN `item` gt ON gt.id=d.get_item_id"
                        + " WHERE d.exchange_id=? ORDER BY d.id",
                JOIN_MAP, exchangeId);
    }

    public static List<ExchangeDetail> listByExchange(Connection c, long exchangeId) {
        return DBUtil.query(c, "SELECT d.*, u.nickname AS nick, u.building AS build,"
                        + " gi.title AS give_title, gt.title AS get_title"
                        + " FROM `exchange_detail` d"
                        + " JOIN `user` u ON u.id=d.user_id"
                        + " JOIN `item` gi ON gi.id=d.give_item_id"
                        + " JOIN `item` gt ON gt.id=d.get_item_id"
                        + " WHERE d.exchange_id=? ORDER BY d.id",
                JOIN_MAP, exchangeId);
    }

    public static ExchangeDetail findByExchangeAndUser(long exchangeId, long userId) {
        return DBUtil.queryOne("SELECT * FROM `exchange_detail` WHERE exchange_id=? AND user_id=?",
                MAP, exchangeId, userId);
    }

    public static boolean isMember(long exchangeId, long userId) {
        return findByExchangeAndUser(exchangeId, userId) != null;
    }

    public static void markConfirmed(Connection c, long exchangeId, long userId) {
        DBUtil.update(c, "UPDATE `exchange_detail` SET confirmed=1, confirm_time=?"
                + " WHERE exchange_id=? AND user_id=?", LocalDateTime.now(), exchangeId, userId);
    }

    public static void markDelivered(Connection c, long exchangeId, long userId) {
        DBUtil.update(c, "UPDATE `exchange_detail` SET delivered=1, deliver_time=?"
                + " WHERE exchange_id=? AND user_id=?", LocalDateTime.now(), exchangeId, userId);
    }

    public static long countRows(long exchangeId) {
        return DBUtil.count("SELECT COUNT(*) FROM `exchange_detail` WHERE exchange_id=?", exchangeId);
    }

    public static long countRows(Connection c, long exchangeId) {
        return DBUtil.count(c, "SELECT COUNT(*) FROM `exchange_detail` WHERE exchange_id=?", exchangeId);
    }

    public static long countConfirmed(long exchangeId) {
        return DBUtil.count("SELECT COUNT(*) FROM `exchange_detail` WHERE exchange_id=? AND confirmed=1",
                exchangeId);
    }

    public static long countConfirmed(Connection c, long exchangeId) {
        return DBUtil.count(c, "SELECT COUNT(*) FROM `exchange_detail` WHERE exchange_id=? AND confirmed=1",
                exchangeId);
    }

    public static long countDelivered(long exchangeId) {
        return DBUtil.count("SELECT COUNT(*) FROM `exchange_detail` WHERE exchange_id=? AND delivered=1",
                exchangeId);
    }

    public static long countDelivered(Connection c, long exchangeId) {
        return DBUtil.count(c, "SELECT COUNT(*) FROM `exchange_detail` WHERE exchange_id=? AND delivered=1",
                exchangeId);
    }

    /** 还没点「已交换」的人，超时扣分要用 */
    public static List<Long> listUndeliveredUsers(long exchangeId) {
        return DBUtil.query("SELECT user_id FROM `exchange_detail` WHERE exchange_id=? AND delivered=0",
                rs -> rs.getLong(1), exchangeId);
    }

    public static List<Long> listUndeliveredUsers(Connection c, long exchangeId) {
        return DBUtil.query(c, "SELECT user_id FROM `exchange_detail` WHERE exchange_id=? AND delivered=0",
                rs -> rs.getLong(1), exchangeId);
    }

    public static List<Long> listAllUsers(long exchangeId) {
        return DBUtil.query("SELECT user_id FROM `exchange_detail` WHERE exchange_id=?",
                rs -> rs.getLong(1), exchangeId);
    }
}
