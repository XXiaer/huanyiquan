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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    /** 约定面交点与时间段 */
    public static void place(long userId, long exchangeId, String place, String dealTime) {
        Exchange e = mustFind(exchangeId);
        if (!ExchangeDetailDao.isMember(exchangeId, userId)) {
            throw BizException.forbidden("你不在这个交换单里");
        }
        if (e.status != Const.EX_WAIT_CONFIRM && e.status != Const.EX_WAIT_DELIVER) {
            throw new BizException(400, "交换单当前状态不能改面交点");
        }
        if (Str.isBlank(place)) {
            throw new BizException(400, "面交点不能为空");
        }
        ExchangeDao.updatePlace(exchangeId, Str.cut(place, 100), Str.cut(dealTime, 50));
        NotificationService.exchange(exchangeId,userId,"面交安排已更新","交换伙伴更新了面交安排。");
        BizLogDao.log(userId, "EXCHANGE", exchangeId, e.status, e.status,
                "面交改为：" + place + " " + (dealTime == null ? "" : dealTime));
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
            closeAndUnlock(e, Const.EX_TIMEOUT, "超过 7 天未完成交付，超时关闭");
            NotificationService.exchange(exchangeId,0,"交换已超时关闭","交付时间已超时，物品已解锁。");
            throw new BizException(400, "超过 7 天没完成交付，这张单已经关闭了");
        }

        List<ExchangeDetail> details = ExchangeDetailDao.listByExchange(exchangeId);
        return DBUtil.tx(c -> {
            Integer lockedStatus=DBUtil.queryOne(c,"SELECT status FROM `exchange` WHERE id=? FOR UPDATE",rs->rs.getInt(1),exchangeId);
            if(lockedStatus==null||lockedStatus!=Const.EX_WAIT_DELIVER)throw BizException.badRequest("交换单状态已变化");
            Long already=DBUtil.queryOne(c,"SELECT delivered FROM exchange_detail WHERE exchange_id=? AND user_id=?",rs->rs.getLong(1),exchangeId,userId);
            if(already==null||already!=0)throw BizException.badRequest("你已经确认过了");
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
        List<ExchangeDetail> details = ExchangeDetailDao.listByExchange(exchangeId);
        e.details = details;
        e.needConfirm = details.size();
        e.confirmedCount = ExchangeDetailDao.countConfirmed(exchangeId);
        e.deliveredCount = ExchangeDetailDao.countDelivered(exchangeId);
        for (ExchangeDetail d : details) {
            if (d.userId.equals(userId)) {
                e.mine = d;
            }
        }
        return e;
    }

    public static List<Exchange> mine(long userId) {
        List<Exchange> list = ExchangeDao.listByUser(userId);
        for (Exchange e : list) {
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
                closeAndUnlock(e, Const.EX_TIMEOUT, "超过 7 天未完成交付，超时关闭");
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
    private static void closeAndUnlock(Exchange e, int targetStatus, String reason) {
        DBUtil.tx(c -> {
            Integer lockedStatus = DBUtil.queryOne(c, "SELECT status FROM `exchange` WHERE id=? FOR UPDATE",
                    rs -> rs.getInt(1), e.id);
            if (lockedStatus == null || (lockedStatus != Const.EX_WAIT_CONFIRM && lockedStatus != Const.EX_WAIT_DELIVER)) {
                throw BizException.badRequest("交换单状态已变化");
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
            return null;
        });
    }
}
