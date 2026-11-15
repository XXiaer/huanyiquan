package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ExchangeDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.OfferDao;
import com.huanyiquan.dao.ReportDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Item;
import com.huanyiquan.entity.Report;
import com.huanyiquan.entity.User;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 运营后台：举报处理与数据看板。 */
public final class AdminService {

    private AdminService() {
    }

    public static List<Report> listReports(Integer status) {
        return ReportDao.list(status);
    }

    /**
     * 处理举报。approve = 认定违规，物品下架 / 用户封禁；reject = 驳回。
     */
    public static Map<String, Object> handleReport(long adminId, long reportId, String action, String note) {
        String act = Str.isBlank(action) ? "" : action.trim().toLowerCase();
        if (!"reject".equals(act) && !"approve".equals(act)) {
            throw new BizException(400, "只能选 approve 或 reject");
        }
        String cutNote = Str.cut(note, 200);
        return DBUtil.tx(c -> {
            Report r = ReportDao.findByIdForUpdate(c, reportId);
            if (r == null) {
                throw BizException.notFound("举报记录不存在");
            }
            if (r.status != null && r.status != Const.REPORT_PENDING) {
                throw new BizException(400, "这条举报已经处理过了");
            }
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("reportId", reportId);

            if ("reject".equals(act)) {
                ReportDao.handle(c, reportId, Const.REPORT_REJECTED, cutNote);
                BizLogDao.log(c, adminId, "REPORT", reportId, Const.REPORT_PENDING,
                        Const.REPORT_REJECTED, "管理员驳回");
                data.put("msg", "已驳回");
                data.put("status", Const.REPORT_REJECTED);
                return data;
            }

            if (r.targetType != null && r.targetType == 1) {
                Long lockedId = DBUtil.queryOne(c, "SELECT id FROM `item` WHERE id=? AND deleted=0 FOR UPDATE",
                        rs -> rs.getLong(1), r.targetId);
                Item it = lockedId == null ? null : ItemDao.findById(c, r.targetId);
                if (it == null) {
                    throw BizException.notFound("被举报物品已不存在");
                }
                if (it.status != null && it.status == Const.ITEM_LOCKED) {
                    throw new BizException(400, "这件物品正在交换中，先让当事人取消交换单再下架");
                }
                ItemDao.updateStatus(c, r.targetId, Const.ITEM_OFF);
                BizLogDao.log(c, adminId, "ITEM", r.targetId, it.status, Const.ITEM_OFF, "管理员下架");
                if (it.ownerId != null) {
                    UserDao.addCredit(c, it.ownerId, -5);
                    BizLogDao.log(c, adminId, "USER", it.ownerId, null, null, "物品被认定违规，信用分 -5");
                }
                data.put("msg", "已下架物品，物主信用分 -5");
            } else {
                User target = UserDao.findByIdForUpdate(c, r.targetId);
                if (target == null || target.role == null || target.role != 0) {
                    throw BizException.badRequest("无法通过举报停用管理员账号");
                }
                UserDao.updateStatus(c, r.targetId, 0);
                BizLogDao.log(c, adminId, "USER", r.targetId, 1, 0, "管理员封禁");
                data.put("msg", "已封禁该用户");
            }
            ReportDao.handle(c, reportId, Const.REPORT_DONE, cutNote);
            BizLogDao.log(c, adminId, "REPORT", reportId, Const.REPORT_PENDING, Const.REPORT_DONE, "管理员认定违规");
            data.put("status", Const.REPORT_DONE);
            return data;
        });
    }

    public static List<Map<String, Object>> users(String keyword) {
        String q = "%" + Str.cut(keyword == null ? "" : keyword.trim(), 60) + "%";
        return DBUtil.query("SELECT id, student_no, nickname, credit, role, status FROM user "
                        + "WHERE student_no LIKE ? OR nickname LIKE ? ORDER BY id DESC LIMIT 100", rs -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("studentNo", rs.getString("student_no"));
            row.put("nickname", rs.getString("nickname"));
            row.put("credit", rs.getInt("credit"));
            row.put("role", rs.getInt("role"));
            row.put("status", rs.getInt("status"));
            return row;
        }, q, q);
    }

    public static void setUserStatus(long adminId, long userId, String action) {
        if (adminId == userId || (!"suspend".equals(action) && !"restore".equals(action))) {
            throw BizException.badRequest("无法执行该账号操作");
        }
        int status = "restore".equals(action) ? 1 : 0;
        DBUtil.tx(c -> {
            int changed = DBUtil.update(c, "UPDATE user SET status=? WHERE id=? AND role=0 AND status=?",
                    status, userId, 1 - status);
            if (changed != 1) throw BizException.badRequest("账号状态已变化，或该账号为管理员");
            DBUtil.update(c, "INSERT INTO biz_log(user_id,target_type,target_id,from_status,to_status,remark) "
                    + "VALUES(?,?,?,?,?,?)", adminId, "USER", userId, 1 - status, status,
                    status == 1 ? "管理员恢复账号" : "管理员停用账号");
            return null;
        });
    }

    public static List<Map<String, Object>> exchangeRecords() {
        return DBUtil.query("SELECT id,type,status,place,create_time FROM `exchange` ORDER BY id DESC LIMIT 100", rs -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("type", rs.getInt("type"));
            row.put("status", rs.getInt("status"));
            row.put("place", rs.getString("place"));
            row.put("createTime", rs.getString("create_time"));
            return row;
        });
    }

    public static List<Map<String, Object>> activity() {
        return DBUtil.query("SELECT id,user_id,target_type,target_id,remark,create_time "
                + "FROM biz_log ORDER BY id DESC LIMIT 100", rs -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("actor", rs.getObject("user_id"));
            row.put("type", rs.getString("target_type"));
            row.put("target", rs.getLong("target_id"));
            row.put("remark", rs.getString("remark"));
            row.put("createTime", rs.getString("create_time"));
            return row;
        });
    }

    /** 数据看板：成交数、成环成功率、热门类别 */
    public static Map<String, Object> dashboard() {
        long done = ExchangeDao.countByStatus(Const.EX_DONE);
        long ringTotal = ExchangeDao.countByType(3);
        long ringDone = ExchangeDao.countByTypeAndStatus(3, Const.EX_DONE);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userCount", UserDao.countAll());
        data.put("itemCount", ItemDao.countByStatus(null));
        data.put("onShelfCount", ItemDao.countByStatus(Const.ITEM_ON));
        data.put("dealCount", done);
        data.put("ringTotal", ringTotal);
        data.put("ringDone", ringDone);
        data.put("ringRate", ringTotal == 0 ? 0 : Math.round(ringDone * 1000.0 / ringTotal) / 10.0);
        data.put("pendingReport", ReportDao.countPending());
        data.put("hotCategories", ItemDao.hotCategories(5));
        return data;
    }
}
