package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ExchangeDao;
import com.huanyiquan.dao.ExchangeDetailDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Exchange;
import com.huanyiquan.entity.ExchangeDetail;
import com.huanyiquan.entity.Offer;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 交换单：生成、三方确认、约定面交、双向确认收货、超时关闭。
 * 所有状态推进都单向，任何一步都不允许回退。
 */
public final class ExchangeService {

    private ExchangeService() {
    }

    /** 一对一报价被接受时调用，必须在调用方的事务里执行 */
    public static long createOneToOne(Connection c, Offer o) {
        Exchange e = new Exchange();
        e.type = 1;
        e.status = Const.EX_WAIT_DELIVER;
        e.offerId = o.id;
        long eid = ExchangeDao.insert(c, e);

        insertDetail(c, eid, o.fromUser, o.myItemId, o.itemId);
        insertDetail(c, eid, o.toUser, o.itemId, o.myItemId);

        ItemDao.updateStatus(c, o.itemId, Const.ITEM_LOCKED);
        ItemDao.updateStatus(c, o.myItemId, Const.ITEM_LOCKED);
        return eid;
    }

    /** 三方单里各自点「确认换」。三人全确认后进入待交付。 */
    public static Map<String, Object> confirm(long userId, long exchangeId) {
        Exchange e = mustFind(exchangeId);
        ExchangeDetail mine = ExchangeDetailDao.findByExchangeAndUser(exchangeId, userId);
        if (mine == null) {
            throw BizException.forbidden("你不在这个交换单里");
        }
        if (e.status == Const.EX_WAIT_DELIVER) {
            throw new BizException(400, "已经确认完了，接下来约面交点就行");
        }
        if (e.status != Const.EX_WAIT_CONFIRM) {
            throw new BizException(400, "交换单当前状态是「" + e.statusText + "」，不能再确认");
        }
        if (mine.confirmed != null && mine.confirmed == 1) {
            throw new BizException(400, "你已经确认过了，等其他人");
        }
        if (e.createTime != null && e.createTime.plusHours(Const.CONFIRM_EXPIRE_HOURS)
                .isBefore(LocalDateTime.now())) {
            closeAndUnlock(e, Const.EX_INVALID, "超过 24 小时未全部确认，整单失效");
            NotificationService.exchange(exchangeId,0,"闭环已超时解散","未在规定时间内完成确认，物品已解锁。");
            throw new BizException(400, "超过 24 小时没凑齐确认，整单已经失效了，物品已解锁");
        }

        Map<String, Object> data = DBUtil.tx(c -> {
            Integer lockedStatus=DBUtil.queryOne(c,"SELECT status FROM `exchange` WHERE id=? FOR UPDATE",rs->rs.getInt(1),exchangeId);
            if(lockedStatus==null||lockedStatus!=Const.EX_WAIT_CONFIRM)throw BizException.badRequest("交换单状态已变化");
            Long already=DBUtil.queryOne(c,"SELECT confirmed FROM exchange_detail WHERE exchange_id=? AND user_id=?",rs->rs.getLong(1),exchangeId,userId);
            if(already==null||already!=0)throw BizException.badRequest("你已经确认过了");
            ExchangeDetailDao.markConfirmed(c, exchangeId, userId);
            NotificationService.exchange(c,exchangeId,userId,"交换单有新进展","有参与者确认了交换。");
            long confirmed = ExchangeDetailDao.countConfirmed(c, exchangeId);
            long need = ExchangeDetailDao.countRows(c, exchangeId);
            BizLogDao.log(c, userId, "EXCHANGE", exchangeId, Const.EX_WAIT_CONFIRM,
                    confirmed >= need ? Const.EX_WAIT_DELIVER : Const.EX_WAIT_CONFIRM,
                    "第 " + confirmed + "/" + need + " 人确认");
            if (confirmed >= need) {
                ExchangeDao.updateStatus(c, exchangeId, Const.EX_WAIT_DELIVER);
                NotificationService.exchange(c,exchangeId,0,"三方已全部确认","闭环交换已生效，请在协商房间约定面交。");
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("exchangeId", exchangeId);
            m.put("confirmed", confirmed);
            m.put("need", need);
            m.put("status", confirmed >= need ? Const.EX_WAIT_DELIVER : Const.EX_WAIT_CONFIRM);
            m.put("statusText", Const.exchangeStatusText(
                    confirmed >= need ? Const.EX_WAIT_DELIVER : Const.EX_WAIT_CONFIRM));
            m.put("msg", confirmed >= need
                    ? "三方都确认了，约个时间面交吧"
                    : "已确认，还差 " + (need - confirmed) + " 人");
            return m;
        });
        return data;
    }

    /** 兼容旧入口：所有面交地点/时间修改统一走版本化提议流程，需对方/全员同意才生效 */
    public static Map<String, Object> place(long userId, long exchangeId, String place, String dealTime) {
        return proposeArrangement(userId, exchangeId, place, dealTime, null, null);
    }

    /** 提出或改期面交安排：生成待确认新版本并通知其余参与者，在全员确认前保留原已确认安排 */
    public static Map<String, Object> proposeArrangement(long userId, long exchangeId, String place,
                                                         String startTime, String endTime, String note) {
        if (Str.isBlank(place)) {
            throw new BizException(400, "面交地点不能为空");
        }
        String cleanPlace = Str.cut(place.trim(), 120);
        String cleanStart = Str.cut(startTime, 40);
        String cleanEnd = Str.cut(endTime, 40);
        String cleanNote = Str.cut(note, 200);

        return DBUtil.tx(c -> {
            Integer exStatus = DBUtil.queryOne(c, "SELECT status FROM `exchange` WHERE id=? FOR UPDATE",
                    rs -> rs.getInt(1), exchangeId);
            if (exStatus == null) {
                throw BizException.notFound("交换单不存在");
            }
            if (DBUtil.count(c, "SELECT COUNT(*) FROM exchange_detail WHERE exchange_id=? AND user_id=?", exchangeId, userId) == 0) {
                throw BizException.forbidden("你不在这个交换单里");
            }
            if (exStatus != Const.EX_WAIT_CONFIRM && exStatus != Const.EX_WAIT_DELIVER) {
                throw new BizException(400, "交换单当前状态不能修改面交安排");
            }

            Integer maxVer = DBUtil.queryOne(c,
                    "SELECT COALESCE(MAX(version), 0) FROM exchange_arrangement WHERE exchange_id=?",
                    rs -> rs.getInt(1), exchangeId);
            int nextVer = (maxVer == null ? 0 : maxVer) + 1;

            DBUtil.update(c, "UPDATE exchange_arrangement SET status=2 WHERE exchange_id=? AND status=0", exchangeId);
            long arrId = DBUtil.insert(c,
                    "INSERT INTO exchange_arrangement(exchange_id,version,proposer_id,place,start_time,end_time,note,status) VALUES(?,?,?,?,?,?,?,0)",
                    exchangeId, nextVer, userId, cleanPlace, cleanStart, cleanEnd, cleanNote);
            DBUtil.update(c, "INSERT IGNORE INTO exchange_arrangement_confirmation(arrangement_id,user_id) VALUES(?,?)",
                    arrId, userId);
            DBUtil.update(c, "UPDATE `exchange` SET pending_arrangement_id=? WHERE id=?", arrId, exchangeId);

            NotificationService.exchange(c, exchangeId, userId,
                    "收到面交安排提议",
                    "对方提议在「" + cleanPlace + "」面交" + (Str.hasText(cleanStart) ? "（" + cleanStart + "）" : "") + "，请确认。");
            BizLogDao.log(c, userId, "EXCHANGE", exchangeId, exStatus, exStatus,
                    "提议面交安排 v" + nextVer + "：" + cleanPlace);

            return loadArrangement(c, arrId, userId, (int) ExchangeDetailDao.countRows(c, exchangeId));
        });
    }

    /** 同意某一版本的面交安排；全员确认后正式生效 */
    public static Map<String, Object> confirmArrangement(long userId, long exchangeId, int version) {
        return DBUtil.tx(c -> {
            Map<String, Object> exRow = DBUtil.queryOne(c,
                    "SELECT status, pending_arrangement_id, confirmed_arrangement_id FROM `exchange` WHERE id=? FOR UPDATE",
                    rs -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("status", rs.getInt(1));
                        m.put("pendingId", rs.getObject(2));
                        m.put("confirmedId", rs.getObject(3));
                        return m;
                    }, exchangeId);
            if (exRow == null) {
                throw BizException.notFound("交换单不存在");
            }
            if (DBUtil.count(c, "SELECT COUNT(*) FROM exchange_detail WHERE exchange_id=? AND user_id=?", exchangeId, userId) == 0) {
                throw BizException.forbidden("你不在这个交换单里");
            }
            int exStatus = ((Number) exRow.get("status")).intValue();
            if (exStatus != Const.EX_WAIT_CONFIRM && exStatus != Const.EX_WAIT_DELIVER) {
                throw new BizException(400, "交换单当前状态不能确认面交安排");
            }

            Map<String, Object> arr = DBUtil.queryOne(c,
                    "SELECT id, status, place, start_time, end_time FROM exchange_arrangement WHERE exchange_id=? AND version=? FOR UPDATE",
                    rs -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", rs.getLong(1));
                        m.put("status", rs.getInt(2));
                        m.put("place", rs.getString(3));
                        m.put("startTime", rs.getString(4));
                        m.put("endTime", rs.getString(5));
                        return m;
                    }, exchangeId, version);
            if (arr == null) {
                throw new BizException(400, "安排已更新，请核对最新版");
            }
            long arrId = ((Number) arr.get("id")).longValue();
            Number pendingIdObj = (Number) exRow.get("pendingId");
            if (((Number) arr.get("status")).intValue() != 0 || pendingIdObj == null || pendingIdObj.longValue() != arrId) {
                throw new BizException(400, "安排已更新，请核对最新版");
            }

            Long already = DBUtil.queryOne(c,
                    "SELECT COUNT(*) FROM exchange_arrangement_confirmation WHERE arrangement_id=? AND user_id=?",
                    rs -> rs.getLong(1), arrId, userId);
            if (already != null && already > 0) {
                throw new BizException(400, "你已经同意过这版安排，等待其他同学确认");
            }
            DBUtil.update(c, "INSERT INTO exchange_arrangement_confirmation(arrangement_id,user_id) VALUES(?,?)", arrId, userId);

            long confirmedCount = DBUtil.count(c, "SELECT COUNT(*) FROM exchange_arrangement_confirmation WHERE arrangement_id=?", arrId);
            int needCount = (int) ExchangeDetailDao.countRows(c, exchangeId);
            boolean allConfirmed = confirmedCount >= needCount;

            if (allConfirmed) {
                DBUtil.update(c, "UPDATE exchange_arrangement SET status=2 WHERE exchange_id=? AND status=1", exchangeId);
                DBUtil.update(c, "UPDATE exchange_arrangement SET status=1 WHERE id=?", arrId);
                String p = (String) arr.get("place");
                String st = (String) arr.get("startTime");
                String et = (String) arr.get("endTime");
                String combinedTime = Str.hasText(st) ? (Str.hasText(et) ? st + " - " + et : st) : "";
                DBUtil.update(c, "UPDATE `exchange` SET confirmed_arrangement_id=?, pending_arrangement_id=NULL, place=?, deal_time=? WHERE id=?",
                        arrId, Str.cut(p, 100), Str.cut(combinedTime, 50), exchangeId);
                NotificationService.exchange(c, exchangeId, 0,
                        "面交安排已正式生效",
                        "全员已确认面交安排：「" + p + "」" + (Str.hasText(combinedTime) ? "（" + combinedTime + "）" : "") + "。");
            } else {
                NotificationService.exchange(c, exchangeId, userId,
                        "面交安排确认进展",
                        "已有 " + confirmedCount + "/" + needCount + " 人同意最新面交安排，请及时核对。");
            }
            BizLogDao.log(c, userId, "EXCHANGE", exchangeId, exStatus, exStatus,
                    "同意面交安排 v" + version + "（" + confirmedCount + "/" + needCount + "）");
            return loadArrangement(c, arrId, userId, needCount);
        });
    }

    /** 各自点「已交换」。全部点完才算完成，才结算信用分。 */
    public static Map<String, Object> done(long userId, long exchangeId) {
        Exchange e = mustFind(exchangeId);
        ExchangeDetail mine = ExchangeDetailDao.findByExchangeAndUser(exchangeId, userId);
        if (mine == null) {
            throw BizException.forbidden("你不在这个交换单里");
        }
        if (e.status == Const.EX_DONE) {
            throw new BizException(400, "这张单已经完成了");
        }
        if (e.status != Const.EX_WAIT_DELIVER) {
            throw new BizException(400, "交换单当前状态是「" + e.statusText + "」，还不能确认收货");
        }
        if (mine.delivered != null && mine.delivered == 1) {
            throw new BizException(400, "你已经确认过了，等其他人");
        }
        if (e.createTime != null && e.createTime.plusDays(Const.DELIVER_EXPIRE_DAYS)
                .isBefore(LocalDateTime.now())) {
            if (!closeAndUnlock(e, Const.EX_TIMEOUT, "超过 7 天未完成交付，超时关闭")) { throw BizException.badRequest("部分交付超时，已转入争议处理"); }
            NotificationService.exchange(exchangeId,0,"交换已超时关闭","交付时间已超时，物品已解锁。");
            throw new BizException(400, "超过 7 天没完成交付，这张单已经关闭了");
        }

        List<ExchangeDetail> details = ExchangeDetailDao.listByExchange(exchangeId);
        return DBUtil.tx(c -> {
            Integer lockedStatus=DBUtil.queryOne(c,"SELECT status FROM `exchange` WHERE id=? FOR UPDATE",rs->rs.getInt(1),exchangeId);
            if(lockedStatus==null||lockedStatus!=Const.EX_WAIT_DELIVER)throw BizException.badRequest("交换单状态已变化");
            Long already=DBUtil.queryOne(c,"SELECT delivered FROM exchange_detail WHERE exchange_id=? AND user_id=?",rs->rs.getLong(1),exchangeId,userId);
            if(already==null||already!=0)throw BizException.badRequest("你已经确认过了");
            long pendingWithoutConfirmed = DBUtil.count(c,
                    "SELECT COUNT(*) FROM `exchange` WHERE id=? AND pending_arrangement_id IS NOT NULL AND confirmed_arrangement_id IS NULL",
                    exchangeId);
            if (pendingWithoutConfirmed > 0) {
                throw BizException.badRequest("请先共同确认面交安排，再确认收货");
            }
            ExchangeDetailDao.markDelivered(c, exchangeId, userId);
            NotificationService.exchange(c,exchangeId,userId,"交换单有新进展","有参与者确认了交付。");
            long delivered = ExchangeDetailDao.countDelivered(c, exchangeId);
            long need = details.size();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("exchangeId", exchangeId);
            m.put("delivered", delivered);
            m.put("need", need);
            BizLogDao.log(c, userId, "EXCHANGE", exchangeId, e.status,
                    delivered >= need ? Const.EX_DONE : e.status,
                    "第 " + delivered + "/" + need + " 人确认收货");
            if (delivered >= need) {
                ExchangeDao.close(c, exchangeId, Const.EX_DONE);
                NotificationService.exchange(c,exchangeId,0,"交换已完成","所有参与者已确认交付，可以互相评价。");
                for (ExchangeDetail d : details) {
                    ItemDao.updateStatus(c, d.giveItemId, Const.ITEM_SWAPPED);
                    BizLogDao.log(c, userId, "ITEM", d.giveItemId, Const.ITEM_LOCKED,
                            Const.ITEM_SWAPPED, "交换完成，物品已换出");
                }
                for (ExchangeDetail d : details) {
                    UserDao.addCredit(c, d.userId, 2);
                    BizLogDao.log(c, null, "USER", d.userId, null, null, "履约完成，信用分 +2");
                }
                m.put("status", Const.EX_DONE);
                m.put("statusText", "已完成");
                m.put("msg", "交换完成，去给对方打个分吧");
            } else {
                m.put("status", Const.EX_WAIT_DELIVER);
                m.put("statusText", "待交付");
                m.put("msg", "已确认，还差 " + (need - delivered) + " 人");
            }
            return m;
        });
    }

    /** 任一方反悔：整单失效，三件物品解锁回在架 */
    public static void cancel(long userId, long exchangeId, String reason) {
        Exchange e = mustFind(exchangeId);
        if (!ExchangeDetailDao.isMember(exchangeId, userId)) {
            throw BizException.forbidden("你不在这个交换单里");
        }
        if (e.status != Const.EX_WAIT_CONFIRM && e.status != Const.EX_WAIT_DELIVER) {
            throw new BizException(400, "交换单当前状态不能取消");
        }
        closeAndUnlock(e, Const.EX_INVALID, "用户取消：" + (Str.isBlank(reason) ? "任一方反悔" : reason));
        NotificationService.exchange(exchangeId,userId,"交换已取消","交换伙伴取消了这笔交换。");
    }

    public static Exchange detail(long userId, long exchangeId) {
        Exchange e = mustFind(exchangeId);
        if (!ExchangeDetailDao.isMember(exchangeId, userId)) {
            throw BizException.forbidden("只有当事人能看这张交换单");
        }
        return populateDetail(e, userId);
    }

    public static Exchange disputeDetail(long exchangeId) {
        Exchange exchange = populateDetail(mustFind(exchangeId), 0);
        if (exchange.dispute == null) {
            throw BizException.notFound("争议不存在");
        }
        return exchange;
    }

    private static Exchange populateDetail(Exchange e, long userId) {
        long exchangeId = e.id;
        List<ExchangeDetail> details = ExchangeDetailDao.listByExchange(exchangeId);
        e.details = details;
        e.dispute = DBUtil.queryOne("SELECT opened_by,reason,resolution FROM exchange_dispute WHERE exchange_id=?",
                rs -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("openedBy", rs.getLong(1));
                    row.put("reason", rs.getString(2));
                    row.put("resolution", rs.getString(3));
                    return row;
                }, exchangeId);
        if (e.dispute != null) {
            e.dispute.put("statements", disputeStatements(exchangeId));
        }
        e.needConfirm = details.size();
        e.confirmedCount = ExchangeDetailDao.countConfirmed(exchangeId);
        e.deliveredCount = ExchangeDetailDao.countDelivered(exchangeId);
        for (ExchangeDetail d : details) {
            if (d.userId.equals(userId)) {
                e.mine = d;
            }
        }
        try (Connection c = DBUtil.getConnection()) {
            if (e.confirmedArrangementId != null) {
                e.confirmedArrangement = loadArrangement(c, e.confirmedArrangementId, userId, details.size());
            }
            if (e.pendingArrangementId != null) {
                e.pendingArrangement = loadArrangement(c, e.pendingArrangementId, userId, details.size());
            }
        } catch (Exception ignore) {
        }
        return e;
    }

    private static Map<String, Object> loadArrangement(Connection c, long arrId, long viewerId, int needCount) {
        Map<String, Object> arr = DBUtil.queryOne(c,
                "SELECT a.*, u.nickname AS proposer_name FROM exchange_arrangement a JOIN `user` u ON u.id=a.proposer_id WHERE a.id=?",
                rs -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", rs.getLong("id"));
                    m.put("exchangeId", rs.getLong("exchange_id"));
                    m.put("version", rs.getInt("version"));
                    m.put("proposerId", rs.getLong("proposer_id"));
                    m.put("proposerName", rs.getString("proposer_name"));
                    m.put("place", rs.getString("place"));
                    m.put("startTime", rs.getString("start_time"));
                    m.put("endTime", rs.getString("end_time"));
                    m.put("note", rs.getString("note"));
                    m.put("status", rs.getInt("status"));
                    m.put("createdAt", Objects.toString(rs.getObject("created_at"), null));
                    return m;
                }, arrId);
        if (arr == null) return null;
        List<Long> confirmedIds = DBUtil.query(c,
                "SELECT user_id FROM exchange_arrangement_confirmation WHERE arrangement_id=?",
                rs -> rs.getLong(1), arrId);
        arr.put("confirmedUserIds", confirmedIds);
        arr.put("confirmedCount", confirmedIds.size());
        arr.put("needCount", needCount);
        arr.put("confirmedByMe", confirmedIds.contains(viewerId));
        return arr;
    }

    public static List<Exchange> mine(long userId) {
        List<Exchange> list = ExchangeDao.listByUser(userId);
        for (Exchange e : list) {
            e.mine = ExchangeDetailDao.findByExchangeAndUser(e.id, userId);
            e.needConfirm = (int) ExchangeDetailDao.countRows(e.id);
            e.confirmedCount = ExchangeDetailDao.countConfirmed(e.id);
            e.deliveredCount = ExchangeDetailDao.countDelivered(e.id);
        }
        return list;
    }

    /**
     * 定时任务：超时清扫。
     * 待确认超过 24 小时 → 已失效；待交付超过 7 天 → 已超时关闭，未确认方信用分 −3。
     */
    public static void closeTimeout() {
        LocalDateTime now = LocalDateTime.now();
        for (Exchange e : ExchangeDao.listExpired(Const.EX_WAIT_CONFIRM,
                now.minusHours(Const.CONFIRM_EXPIRE_HOURS))) {
            try {
                closeAndUnlock(e, Const.EX_INVALID, "24 小时未全部确认，自动失效");
                NotificationService.exchange(e.id,0,"闭环已超时解散","未在规定时间内完成确认，物品已解锁。");
            } catch (Exception ex) {
                System.err.println("[定时任务] 关闭交换单 " + e.id + " 失败：" + ex.getMessage());
            }
        }
        for (Exchange e : ExchangeDao.listExpired(Const.EX_WAIT_DELIVER,
                now.minusDays(Const.DELIVER_EXPIRE_DAYS))) {
            try {
                if (!closeAndUnlock(e, Const.EX_TIMEOUT, "超过 7 天未完成交付，超时关闭")) continue;
                NotificationService.exchange(e.id,0,"交换已超时关闭","交付时间已超时，物品已解锁。");
            } catch (Exception ex) {
                System.err.println("[定时任务] 超时关闭 " + e.id + " 失败：" + ex.getMessage());
            }
        }
    }

    // ------------------------------------------------------------------ 内部

    private static void insertDetail(Connection c, long exchangeId, long userId,
                                     Long giveItemId, Long getItemId) {
        ExchangeDetail d = new ExchangeDetail();
        d.exchangeId = exchangeId;
        d.userId = userId;
        d.giveItemId = giveItemId;
        d.getItemId = getItemId;
        ExchangeDetailDao.insert(c, d);
    }

    private static Exchange mustFind(long exchangeId) {
        Exchange e = ExchangeDao.findById(exchangeId);
        if (e == null) {
            throw BizException.notFound("交换单不存在");
        }
        return e;
    }

    /** 关闭单据 + 把所有换出物品解锁回在架 + 超时扣分，同事务完成 */
    public static void submitDispute(long userId, long exchangeId, String statement) {
        String body = disputeText(statement);
        DBUtil.tx(c -> {
            Integer status = lockExchange(c, exchangeId);
            if (DBUtil.count(c, "SELECT COUNT(*) FROM exchange_detail WHERE exchange_id=? AND user_id=?",
                    exchangeId, userId) == 0) {
                throw BizException.forbidden("你不在这个交换单里");
            }
            if (status == Const.EX_WAIT_CONFIRM || status == Const.EX_WAIT_DELIVER) {
                DBUtil.update(c, "INSERT INTO exchange_dispute(exchange_id,opened_by,previous_status,reason) VALUES(?,?,?,?)",
                        exchangeId, userId, status, body);
                ExchangeDao.updateStatus(c, exchangeId, Const.EX_DISPUTED);
                BizLogDao.log(c, userId, "EXCHANGE", exchangeId, status, Const.EX_DISPUTED, "用户发起面交争议");
                NotificationService.exchange(c, exchangeId, userId, "面交争议已受理", "交换暂停，请在交换单补充情况。");
            } else if (status == Const.EX_DISPUTED) {
                DBUtil.update(c, "INSERT INTO exchange_dispute_statement(exchange_id,user_id,body) VALUES(?,?,?)",
                        exchangeId, userId, body);
            } else {
                throw BizException.badRequest("当前交换单无法提交争议");
            }
            return null;
        });
    }

    public static List<Map<String, Object>> disputes() {
        return DBUtil.query("SELECT exchange_id,opened_by,reason,resolution FROM exchange_dispute ORDER BY resolved_at IS NOT NULL, opened_at DESC LIMIT 100",
                rs -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("exchangeId", rs.getLong(1));
                    row.put("openedBy", rs.getLong(2));
                    row.put("reason", rs.getString(3));
                    row.put("resolution", rs.getString(4));
                    return row;
                });
    }

    public static List<Map<String, Object>> disputeStatements(long exchangeId) {
        return DBUtil.query("SELECT user_id,body,created_at FROM exchange_dispute_statement WHERE exchange_id=? ORDER BY id",
                rs -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("userId", rs.getLong(1));
                    row.put("body", rs.getString(2));
                    row.put("createdAt", rs.getString(3));
                    return row;
                }, exchangeId);
    }

    public static void resolveDispute(long adminId, long exchangeId, String outcome, String note) {
        String explanation = disputeText(note);
        if (!"cancel".equals(outcome) && !"complete".equals(outcome)) {
            throw BizException.badRequest("请选择取消交易或确认已完成");
        }
        DBUtil.tx(c -> {
            int status = lockExchange(c, exchangeId);
            if (status != Const.EX_DISPUTED) {
                throw BizException.badRequest("争议已处理或不存在");
            }
            boolean complete = "complete".equals(outcome);
            int target = complete ? Const.EX_DONE : Const.EX_INVALID;
            DBUtil.update(c, "UPDATE exchange_dispute SET resolved_by=?,resolution=?,resolved_at=NOW() WHERE exchange_id=?",
                    adminId, explanation, exchangeId);
            ExchangeDao.close(c, exchangeId, target);
            for (ExchangeDetail detail : ExchangeDetailDao.listByExchange(c, exchangeId)) {
                ItemDao.updateStatus(c, detail.giveItemId, complete ? Const.ITEM_SWAPPED : Const.ITEM_ON);
                if (complete) {
                    ExchangeDetailDao.markDelivered(c, exchangeId, detail.userId);
                    UserDao.addCredit(c, detail.userId, 2);
                }
            }
            BizLogDao.log(c, adminId, "EXCHANGE", exchangeId, status, target, "争议裁决：" + outcome);
            NotificationService.exchange(c, exchangeId, 0, "面交争议已处理", "请在交换单查看裁决及理由。");
            return null;
        });
    }

    private static int lockExchange(Connection c, long exchangeId) {
        Integer status = DBUtil.queryOne(c, "SELECT status FROM `exchange` WHERE id=? FOR UPDATE",
                rs -> rs.getInt(1), exchangeId);
        if (status == null) {
            throw BizException.notFound("交换单不存在");
        }
        return status;
    }

    private static String disputeText(String text) {
        if (Str.isBlank(text) || text.trim().length() > 1000) {
            throw BizException.badRequest("请填写 1 到 1000 字的情况说明");
        }
        return text.trim();
    }


    private static boolean closeAndUnlock(Exchange e, int targetStatus, String reason) {
        return DBUtil.tx(c -> {
            Integer lockedStatus = DBUtil.queryOne(c, "SELECT status FROM `exchange` WHERE id=? FOR UPDATE",
                    rs -> rs.getInt(1), e.id);
            if (lockedStatus == null || (lockedStatus != Const.EX_WAIT_CONFIRM && lockedStatus != Const.EX_WAIT_DELIVER)) {
                throw BizException.badRequest("交换单状态已变化");
            }
            if (ExchangeDetailDao.countDelivered(c, e.id) > 0) {
                if (targetStatus != Const.EX_TIMEOUT) {
                    throw BizException.badRequest("已有参与者确认收货，请提交面交争议由管理员处理");
                }
                String timeoutReason = "部分参与者已确认收货，其他参与者超过交付期限未确认。";
                DBUtil.update(c, "INSERT INTO exchange_dispute(exchange_id,opened_by,previous_status,reason) VALUES(?,?,?,?)",
                        e.id, 0L, lockedStatus, timeoutReason);
                ExchangeDao.updateStatus(c, e.id, Const.EX_DISPUTED);
                BizLogDao.log(c, null, "EXCHANGE", e.id, lockedStatus, Const.EX_DISPUTED, timeoutReason);
                NotificationService.exchange(c, e.id, 0, "部分交付待核实", "交易已暂停，请在交换单补充情况。");
                return false;
            }
            List<ExchangeDetail> details = ExchangeDetailDao.listByExchange(c, e.id);
            ExchangeDao.close(c, e.id, targetStatus);
            for (ExchangeDetail d : details) {
                ItemDao.updateStatus(c, d.giveItemId, Const.ITEM_ON);
                BizLogDao.log(c, null, "ITEM", d.giveItemId, Const.ITEM_LOCKED, Const.ITEM_ON,
                        "交换单失效，物品解锁");
            }
            if (targetStatus == Const.EX_TIMEOUT) {
                for (Long uid : ExchangeDetailDao.listUndeliveredUsers(c, e.id)) {
                    UserDao.addCredit(c, uid, -3);
                    BizLogDao.log(c, null, "USER", uid, null, null, "超时未确认交付，信用分 -3");
                }
            }
            BizLogDao.log(c, null, "EXCHANGE", e.id, lockedStatus, targetStatus, reason);
            return true;
        });
    }
}
