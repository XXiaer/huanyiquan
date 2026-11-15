package com.huanyiquan.dao;

import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.User;

import java.sql.Connection;
import java.time.LocalDateTime;

/** 用户表 DAO。 */
public final class UserDao {

    private static final DBUtil.RowMapper<User> MAP = rs -> {
        User u = new User();
        u.id = rs.getLong("id");
        u.studentNo = rs.getString("student_no");
        u.nickname = rs.getString("nickname");
        u.password = rs.getString("password");
        u.salt = rs.getString("salt");
        u.college = rs.getString("college");
        u.building = rs.getString("building");
        u.credit = rs.getInt("credit");
        u.status = rs.getInt("status");
        u.role = rs.getInt("role");
        u.failCount = rs.getInt("fail_count");
        u.lockUntil = rs.getObject("lock_until", LocalDateTime.class);
        u.lastLogin = rs.getObject("last_login", LocalDateTime.class);
        u.createTime = rs.getObject("create_time", LocalDateTime.class);
        return u;
    };

    private UserDao() {
    }

    public static User findById(long id) {
        return DBUtil.queryOne("SELECT * FROM `user` WHERE id=? AND deleted=0", MAP, id);
    }

    public static User findByIdForUpdate(Connection c, long id) {
        return DBUtil.queryOne(c, "SELECT * FROM `user` WHERE id=? AND deleted=0 FOR UPDATE", MAP, id);
    }

    public static User findByStudentNo(String studentNo) {
        return DBUtil.queryOne("SELECT * FROM `user` WHERE student_no=? AND deleted=0", MAP, studentNo);
    }

    public static boolean existsStudentNo(String studentNo) {
        return DBUtil.count("SELECT COUNT(*) FROM `user` WHERE student_no=?", studentNo) > 0;
    }

    public static long insert(User u) {
        return DBUtil.insert(
                "INSERT INTO `user`(student_no,nickname,password,salt,college,building,credit,status,role,fail_count,create_time)"
                        + " VALUES(?,?,?,?,?,?,?,?,?,0,?)",
                u.studentNo, u.nickname, u.password, u.salt, u.college, u.building,
                u.credit, u.status, u.role, LocalDateTime.now());
    }

    public static long insert(Connection c, User u) {
        return DBUtil.insert(c,
                "INSERT INTO `user`(student_no,nickname,password,salt,college,building,credit,status,role,fail_count,create_time)"
                        + " VALUES(?,?,?,?,?,?,?,?,?,0,?)",
                u.studentNo, u.nickname, u.password, u.salt, u.college, u.building,
                u.credit, u.status, u.role, LocalDateTime.now());
    }

    /** 登录成功：清零失败次数、解锁、记最后登录时间 */
    public static void markLoginOk(long id) {
        DBUtil.update("UPDATE `user` SET fail_count=0, lock_until=NULL, last_login=? WHERE id=?",
                LocalDateTime.now(), id);
    }

    /** 登录失败：累计次数，达到 5 次锁 10 分钟 */
    public static void markLoginFail(long id, int failCount, LocalDateTime lockUntil) {
        DBUtil.update("UPDATE `user` SET fail_count=?, lock_until=? WHERE id=?",
                failCount, lockUntil, id);
    }

    public static void updateProfile(long id, String nickname, String college, String building) {
        DBUtil.update("UPDATE `user` SET nickname=?, college=?, building=? WHERE id=?",
                nickname, college, building, id);
    }

    /** 信用分增减，自动夹在 0-100 之间 */
    public static void addCredit(Connection c, long id, int delta) {
        DBUtil.update(c, "UPDATE `user` SET credit=LEAST(100, GREATEST(0, credit+?)) WHERE id=?", delta, id);
    }

    public static void addCredit(long id, int delta) {
        DBUtil.update("UPDATE `user` SET credit=LEAST(100, GREATEST(0, credit+?)) WHERE id=?", delta, id);
    }

    public static void updateStatus(long id, int status) {
        DBUtil.update("UPDATE `user` SET status=? WHERE id=?", status, id);
    }

    public static void updateStatus(Connection c, long id, int status) {
        DBUtil.update(c, "UPDATE `user` SET status=? WHERE id=?", status, id);
    }

    public static long countAll() {
        return DBUtil.count("SELECT COUNT(*) FROM `user` WHERE deleted=0");
    }

    /** 成交单数：参与过且已完成的交换 */
    public static long countDoneDeals(long userId) {
        return DBUtil.count("SELECT COUNT(*) FROM exchange_detail d"
                + " JOIN `exchange` e ON e.id=d.exchange_id"
                + " WHERE d.user_id=? AND e.status=3", userId);
    }

    public static long countByRole(int role) {
        return DBUtil.count("SELECT COUNT(*) FROM `user` WHERE deleted=0 AND role=?", role);
    }
}
