package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.PasswordUtil;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.ReviewDao;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.entity.User;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** 账号与信用。 */
public final class UserService {

    private static final DateTimeFormatter MINUTE = DateTimeFormatter.ofPattern("HH:mm");

    private UserService() {
    }

    public static User login(String studentNo, String password) {
        if (Str.isBlank(studentNo) || Str.isBlank(password)) {
            throw new BizException(400, "学号和密码都要填");
        }
        User u = UserDao.findByStudentNo(studentNo.trim());
        // 账号不存在和密码错误返回同一句话，不泄露账号是否存在
        if (u == null) {
            throw new BizException(400, "学号或密码不正确");
        }
        if (u.status != null && u.status == 0) {
            throw new BizException(403, "账号已被封禁，请联系管理员");
        }
        if (u.lockUntil != null && u.lockUntil.isAfter(LocalDateTime.now())) {
            throw new BizException(403, "密码错误次数过多，请在 "
                    + u.lockUntil.format(MINUTE) + " 之后再试");
        }
        if (!PasswordUtil.matches(password, u.salt, u.password)) {
            int fail = (u.failCount == null ? 0 : u.failCount) + 1;
            if (fail >= 5) {
                UserDao.markLoginFail(u.id, 0, LocalDateTime.now().plusMinutes(10));
                throw new BizException(403, "密码连续错 5 次，账号锁定 10 分钟");
            }
            UserDao.markLoginFail(u.id, fail, null);
            throw new BizException(400, "学号或密码不正确，还可以再试 " + (5 - fail) + " 次");
        }
        UserDao.markLoginOk(u.id);
        // 登录响应也把统计带上，前端拿到就能直接渲染「我的」，不用再多请求一次
        User full = UserDao.findById(u.id);
        fillStats(full);
        return full;
    }

    /** 当前登录人的完整信息 */
    public static User profile(long userId) {
        User u = UserDao.findById(userId);
        if (u == null) {
            throw BizException.notFound("用户不存在");
        }
        fillStats(u);
        return u;
    }

    /** 对外展示的主页信息，不含学号 */
    public static User publicProfile(long userId) {
        User u = profile(userId);
        u.studentNo = null;
        return u;
    }

    /** 主页和「我的」共用的一组统计，两处口径必须一致 */
    private static void fillStats(User u) {
        u.onShelfCount = ItemDao.countOnShelf(u.id);
        u.avgScore = ReviewDao.avgScore(u.id);
        u.reviewCount = ReviewDao.countByTarget(u.id);
        u.dealCount = UserDao.countDoneDeals(u.id);
        long good = ReviewDao.countGood(u.id);
        u.goodRate = (u.reviewCount == null || u.reviewCount == 0)
                ? null : (int) Math.round(good * 100.0 / u.reviewCount);
        u.creditLevel = creditLevel(u.credit);
    }

    /** 信用分换算成等级文案，前后端用同一套阈值 */
    public static String creditLevel(Integer credit) {
        int c = credit == null ? 0 : credit;
        if (c >= Const.CREDIT_LEVEL_EXCELLENT) {
            return "优秀";
        }
        if (c >= Const.CREDIT_LEVEL_GOOD) {
            return "良好";
        }
        if (c >= Const.CREDIT_LEVEL_FAIR) {
            return "一般";
        }
        if (c >= Const.CREDIT_LEVEL_LOW) {
            return "较低";
        }
        return "受限";
    }

    /** 信用分变动明细。状态日志里带「信用分」三个字的才是，其余是物品和交换单的状态流转。 */
    public static List<Map<String, Object>> creditLog(long userId) {
        List<Map<String, Object>> all = BizLogDao.listByTarget("USER", userId, 60);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> m : all) {
            String remark = m.get("remark") == null ? "" : String.valueOf(m.get("remark"));
            if (remark.contains("信用分")) {
                out.add(m);
            }
        }
        return out;
    }

    public static void updateProfile(long userId, String nickname, String college, String building) {
        User u = UserDao.findById(userId);
        if (u == null) {
            throw BizException.notFound("用户不存在");
        }
        String nick = Str.isBlank(nickname) ? u.nickname : nickname.trim();
        if (nick.length() > 20) {
            throw new BizException(400, "昵称不超过 20 个字");
        }
        SensitiveWordDao.check(nick, "昵称");
        String col = Str.isBlank(college) ? u.college : Str.cut(college, 50);
        String bld = Str.isBlank(building) ? u.building : Str.cut(building, 50);
        UserDao.updateProfile(userId, nick, col, bld);
    }

    public static void addCredit(long userId, int delta, String remark) {
        UserDao.addCredit(userId, delta);
        BizLogDao.log(userId, "USER", userId, null, null,
                "信用分 " + (delta > 0 ? "+" : "") + delta + "：" + remark);
    }

    /** 首次启动时建一个管理员账号，方便进后台 */
    public static void ensureAdmin() {
        if (UserDao.countByRole(1) > 0) {
            return;
        }
        User u = new User();
        u.studentNo = "admin";
        u.nickname = "平台管理员";
        u.salt = PasswordUtil.newSalt();
        String envPwd = System.getenv("ADMIN_PASSWORD");
        boolean generated = envPwd == null || envPwd.trim().isEmpty();
        String adminPassword = generated ? PasswordUtil.newSalt().substring(0, 16) : envPwd.trim();
        u.password = PasswordUtil.hash(adminPassword, u.salt);
        u.college = "学生工作处";
        u.building = "行政楼";
        u.credit = Const.CREDIT_MAX;
        u.status = 1;
        u.role = 1;
        UserDao.insert(u);
        System.out.println(generated
                ? "[初始化] 已创建管理员账号 admin，随机初始密码：" + adminPassword + "（请尽快登录修改）"
                : "[初始化] 已按环境变量 ADMIN_PASSWORD 创建管理员账号：admin");
    }
}
