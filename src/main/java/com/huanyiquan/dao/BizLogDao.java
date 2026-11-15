package com.huanyiquan.dao;

import com.huanyiquan.db.DBUtil;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 状态变更日志。所有状态推进都要落一条，答辩查纠纷靠它。
 * 写日志失败不能拖垮主流程，所以这里只打印不抛。
 */
public final class BizLogDao {

    private BizLogDao() {
    }

    /** 某个对象的操作记录，最新在前。信用分变动明细就从这里读。 */
    public static List<Map<String, Object>> listByTarget(String targetType, long targetId, int limit) {
        return DBUtil.query("SELECT remark, create_time FROM `biz_log`"
                        + " WHERE target_type=? AND target_id=? ORDER BY id DESC LIMIT ?",
                rs -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("remark", rs.getString("remark"));
                    m.put("createTime", rs.getObject("create_time", LocalDateTime.class));
                    return m;
                }, targetType, targetId, limit);
    }

    public static void log(Connection c, Long userId, String targetType, long targetId,
                           Integer fromStatus, Integer toStatus, String remark) {
        try {
            DBUtil.update(c, "INSERT INTO `biz_log`(user_id,target_type,target_id,from_status,to_status,"
                            + "remark,create_time) VALUES(?,?,?,?,?,?,?)",
                    userId, targetType, targetId, fromStatus, toStatus, remark, LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("[日志] 写入失败：" + e.getMessage());
        }
    }

    public static void log(Long userId, String targetType, long targetId,
                           Integer fromStatus, Integer toStatus, String remark) {
        try (Connection c = DBUtil.getConnection()) {
            log(c, userId, targetType, targetId, fromStatus, toStatus, remark);
        } catch (Exception e) {
            System.err.println("[日志] 写入失败：" + e.getMessage());
        }
    }
}
