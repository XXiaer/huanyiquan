package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.ReportDao;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.entity.Item;
import com.huanyiquan.entity.Report;
import com.huanyiquan.entity.User;

import java.util.LinkedHashMap;
import java.util.Map;

/** 举报。同一对象被举报 3 次以上自动隐藏，等人工复核。 */
public final class ReportService {

    private ReportService() {
    }

    public static Map<String, Object> create(long userId, Integer targetType, long targetId, String reason) {
        if (targetType == null || (targetType != 1 && targetType != 2)) {
            throw new BizException(400, "举报对象类型只能是 1 物品 或 2 用户");
        }
        if (Str.isBlank(reason)) {
            throw new BizException(400, "写一下举报原因，方便管理员判断");
        }
        if (reason.length() > 200) {
            throw new BizException(400, "举报原因不超过 200 个字");
        }
        SensitiveWordDao.check(reason, "举报原因");

        if (targetType == 1) {
            Item it = ItemDao.findById(targetId);
            if (it == null) {
                throw BizException.notFound("被举报的物品不存在");
            }
            if (it.ownerId.equals(userId)) {
                throw new BizException(400, "不能举报自己的物品");
            }
        } else {
            User u = UserDao.findById(targetId);
            if (u == null) {
                throw BizException.notFound("被举报的用户不存在");
            }
            if (u.id.equals(userId)) {
                throw new BizException(400, "不能举报自己");
            }
        }

        Report r = new Report();
        r.targetType = targetType;
        r.targetId = targetId;
        r.reason = Str.cut(reason, 200);
        r.reporterId = userId;
        long reportId = ReportDao.insert(r);
        BizLogDao.log(userId, "REPORT", reportId, null, Const.REPORT_PENDING, "提交举报");

        boolean autoHidden = false;
        if (targetType == 1 && ReportDao.countByTarget(targetType, targetId) >= 3) {
            Item it = ItemDao.findById(targetId);
            // 只隐藏还在架的物品，锁定中的交给交换单流程处理，别把状态机搅乱
            if (it != null && it.status != null && it.status == Const.ITEM_ON) {
                ItemDao.updateStatus(targetId, Const.ITEM_OFF);
                BizLogDao.log(null, "ITEM", targetId, Const.ITEM_ON, Const.ITEM_OFF,
                        "被举报 3 次以上，自动隐藏待复核");
                autoHidden = true;
            }
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("reportId", reportId);
        data.put("autoHidden", autoHidden);
        data.put("msg", autoHidden
                ? "已收到举报。这件物品被举报多次，已自动隐藏等管理员复核"
                : "已收到举报，管理员会尽快处理");
        return data;
    }
}
