package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.PasswordUtil;
import com.huanyiquan.dao.IntentDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Intent;
import com.huanyiquan.entity.Item;
import com.huanyiquan.entity.User;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 演示数据。造三个人、三件物品，正好凑成一个闭环。
 * 用于答辩现场三十秒内跑通核心功能，不用手动发三条意向。
 */
public final class DemoService {

    private DemoService() {
    }

    public static Map<String, Object> seed() {
        if (UserDao.existsStudentNo("2021210001")) {
            throw new BizException(400, "演示数据已经造过了，重复执行会把环搅乱，先清库再来");
        }
        return seedInternal();
    }

    /**
     * 真正造数据。演示账号已经存在时复用原来的 id，不删不重建。
     * 这一点很关键：用户的 id 一旦变化，浏览器里已登录的会话就指向了一个不存在的账号，
     * 点「我的」会报「用户不存在」。所以重置只能清业务数据，不能换账号身份。
     */
    private static Map<String, Object> seedInternal() {
        return DBUtil.tx(conn -> {
            long aid = ensureDemoUser(conn, "2021210001", "小林", "计算机学院", "紫荆 3 号楼");
            long bid = ensureDemoUser(conn, "2021210002", "阿哲", "机械学院", "紫荆 5 号楼");
            long cid = ensureDemoUser(conn, "2021210003", "雨桐", "外国语学院", "紫荆 5 号楼");

            long keyboard = demoItem(conn, aid, "机械键盘", "数码", "九成新",
                    "87 键红轴，带手托，宿舍自提", "想换一副羽毛球拍");
            long racket = demoItem(conn, bid, "羽毛球拍", "运动", "九成新",
                    "尤尼克斯入门款，送两只球", "想换一副降噪耳机");
            long headset = demoItem(conn, cid, "降噪耳机", "数码", "九成新",
                    "头戴式，续航还行，耳罩有点旧", "想换一把机械键盘");

            // 三件物品各自的意向，正好首尾相接
            demoIntent(conn, aid, keyboard, "运动", racket);
            demoIntent(conn, bid, racket, "数码", headset);
            demoIntent(conn, cid, headset, "数码", keyboard);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("users", new String[]{"2021210001 小林 / 123456", "2021210002 阿哲 / 123456",
                    "2021210003 雨桐 / 123456"});
            data.put("itemIds", new long[]{keyboard, racket, headset});
            data.put("howTo", "用 小林 登录，对「机械键盘」请求 GET /api/cycle/" + keyboard + "，就能看到一条三方环");
            return data;
        });
    }

    /**
     * 重置演示数据：清空全部业务数据（保留用户、敏感词），再重新生成三件物品。
     * 答辩前用一次，三十秒回到干净状态。
     * 注意：这里**不删用户**。删了重插会换掉自增 id，已经登录的人会被踢下线。
     */
    public static Map<String, Object> reset() {
        DBUtil.tx(c -> {
            DBUtil.update(c, "DELETE FROM `biz_log`");
            DBUtil.update(c, "DELETE FROM `exchange_detail`");
            DBUtil.update(c, "DELETE FROM `exchange`");
            DBUtil.update(c, "DELETE FROM `offers`");
            DBUtil.update(c, "DELETE FROM `review`");
            DBUtil.update(c, "DELETE FROM `report`");
            DBUtil.update(c, "DELETE FROM `intent`");
            DBUtil.update(c, "DELETE FROM `item`");
            return null;
        });
        System.out.println("[演示] 业务数据已清空，重新生成");
        return seedInternal();
    }

    /** 按学号取 id，没有就建；已存在则把资料和密码复位，id 保持不动 */
    private static long ensureDemoUser(java.sql.Connection conn, String no, String nick,
                                       String college, String building) {
        Long id = DBUtil.queryOne(conn, "SELECT id FROM `user` WHERE student_no=?",
                rs -> rs.getLong(1), no);
        if (id == null) {
            return UserDao.insert(conn, demoUser(no, nick, college, building));
        }
        String salt = PasswordUtil.newSalt();
        DBUtil.update(conn, "UPDATE `user` SET nickname=?, college=?, building=?, salt=?, password=?,"
                        + " credit=?, status=1, fail_count=0, lock_until=NULL WHERE id=?",
                nick, college, building, salt, PasswordUtil.hash("123456", salt),
                Const.CREDIT_INIT, id);
        return id;
    }

    private static User demoUser(String no, String nick, String college, String building) {
        User u = new User();
        u.studentNo = no;
        u.nickname = nick;
        u.salt = PasswordUtil.newSalt();
        u.password = PasswordUtil.hash("123456", u.salt);
        u.college = college;
        u.building = building;
        u.credit = Const.CREDIT_INIT;
        u.status = 1;
        u.role = 0;
        return u;
    }

    private static long demoItem(java.sql.Connection c, long ownerId, String title, String category,
                                 String condition, String desc, String expect) {
        Item it = new Item();
        it.ownerId = ownerId;
        it.title = title;
        it.category = category;
        it.conditionLevel = condition;
        it.description = desc;
        it.expectDesc = expect;
        it.status = Const.ITEM_ON;
        return ItemDao.insert(c, it);
    }

    private static void demoIntent(java.sql.Connection c, long userId, long itemId,
                                   String wantCategory, long wantItemId) {
        Intent i = new Intent();
        i.userId = userId;
        i.itemId = itemId;
        i.wantCategory = wantCategory;
        i.wantItemId = wantItemId;
        IntentDao.insert(c, i);
    }
}
