package com.huanyiquan.dao;

import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Report;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** 举报 DAO。 */
public final class ReportDao {

    private static final String JOIN_SELECT =
            "SELECT r.*, u.nickname AS r_nick,"
                    + " (SELECT i.title FROM `item` i WHERE i.id=r.target_id) AS t_title"
                    + " FROM `report` r JOIN `user` u ON u.id=r.reporter_id ";

    private static final DBUtil.RowMapper<Report> JOIN_MAP = rs -> {
        Report r = base(rs);
        r.reporterNickname = rs.getString("r_nick");
        r.targetTitle = rs.getString("t_title");
        return r;
    };

    private static final DBUtil.RowMapper<Report> MAP = rs -> base(rs);

    private ReportDao() {
    }

    static Report base(java.sql.ResultSet rs) throws java.sql.SQLException {
        Report r = new Report();
        r.id = rs.getLong("id");
        r.targetType = rs.getInt("target_type");
        r.targetId = rs.getLong("target_id");
        r.reason = rs.getString("reason");
        r.reporterId = rs.getLong("reporter_id");
        r.status = rs.getInt("status");
        r.handleNote = rs.getString("handle_note");
        r.createTime = rs.getObject("create_time", LocalDateTime.class);
        r.handleTime = rs.getObject("handle_time", LocalDateTime.class);
        return r;
    }

    public static long insert(Report r) {
        return DBUtil.insert("INSERT INTO `report`(target_type,target_id,reason,reporter_id,status,create_time)"
                        + " VALUES(?,?,?,?,0,?)",
                r.targetType, r.targetId, r.reason, r.reporterId, LocalDateTime.now());
    }

    public static Report findById(long id) {
        return DBUtil.queryOne(JOIN_SELECT + " WHERE r.id=?", JOIN_MAP, id);
    }

    public static Report findByIdForUpdate(Connection c, long id) {
        return DBUtil.queryOne(c, "SELECT * FROM `report` WHERE id=? FOR UPDATE", MAP, id);
    }

    public static List<Report> list(Integer status) {
        StringBuilder sql = new StringBuilder(JOIN_SELECT);
        List<Object> args = new ArrayList<>();
        if (status == null) {
            sql.append(" WHERE 1=1");
        } else {
            sql.append(" WHERE r.status=?");
            args.add(status);
        }
        sql.append(" ORDER BY r.id DESC LIMIT 100");
        return DBUtil.query(sql.toString(), JOIN_MAP, args.toArray());
    }

    public static void handle(long id, int status, String note) {
        DBUtil.update("UPDATE `report` SET status=?, handle_note=?, handle_time=? WHERE id=?",
                status, note, LocalDateTime.now(), id);
    }

    public static void handle(Connection c, long id, int status, String note) {
        DBUtil.update(c, "UPDATE `report` SET status=?, handle_note=?, handle_time=? WHERE id=?",
                status, note, LocalDateTime.now(), id);
    }

    public static long countByTarget(int targetType, long targetId) {
        return DBUtil.count("SELECT COUNT(*) FROM `report` WHERE target_type=? AND target_id=?",
                targetType, targetId);
    }

    public static long countPending() {
        return DBUtil.count("SELECT COUNT(*) FROM `report` WHERE status=0");
    }
}
