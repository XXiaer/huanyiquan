package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.OfferDao;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Item;
import com.huanyiquan.entity.Offer;
import com.huanyiquan.entity.User;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 报价：发起、接受、拒绝、还价、撤回、超时失效。 */
public final class OfferService {

    private OfferService() {
    }

    /** 发起报价：从我的在架物品里选一件，去换对方的物品。 */
    public static long create(long userId, long itemId, long myItemId, String message) {
        User me = UserDao.findById(userId);
        if (me == null) {
            throw BizException.notFound("用户不存在");
        }
        if (me.credit == null || me.credit < Const.CREDIT_MIN_TO_PUBLISH) {
            throw BizException.forbidden("信用分低于 60，暂时不能发起报价");
        }
        Item target = ItemDao.findById(itemId);
        if (target == null) {
            throw BizException.notFound("物品不存在");
        }
        if (Boolean.TRUE.equals(target.isDemo)) throw BizException.badRequest("这是展示样品，暂不参与交换");
        if (target.ownerId.equals(userId)) {
            throw new BizException(400, "这是你自己的物品，换不了");
        }
        if (target.status != Const.ITEM_ON) {
            throw new BizException(400, "这件物品已经不在架上了");
        }
        Item mine = ItemDao.findById(myItemId);
        if (mine == null) {
            throw BizException.notFound("你选的物品不存在");
        }
        if (Boolean.TRUE.equals(mine.isDemo)) throw BizException.badRequest("展示样品不能参与交换");
        if (!mine.ownerId.equals(userId)) {
            throw BizException.forbidden("只能拿自己的物品去换");
        }
        if (mine.status != Const.ITEM_ON) {
            throw new BizException(400, "你选的物品不在架上，换一件吧");
        }
        if (OfferDao.existsPending(itemId, userId)) {
            throw new BizException(400, "你已经报过价了，等对方回应");
        }
        String msg = Str.cut(message, 50);
        SensitiveWordDao.check(msg, "留言");

        return DBUtil.tx(c -> {
            Offer o = new Offer();
            o.itemId = itemId;
            o.myItemId = myItemId;
            o.fromUser = userId;
            o.toUser = target.ownerId;
            o.message = msg;
            o.status = Const.OFFER_PENDING;
            o.expireTime = LocalDateTime.now().plusHours(Const.OFFER_EXPIRE_HOURS);
            long id = OfferDao.insert(c, o);
            ItemDao.incrOfferCount(c, itemId);
            NotificationService.send(c,target.ownerId,"收到新报价","有人想交换你的「"+target.title+"」。","#/offers");
            BizLogDao.log(c, userId, "OFFER", id, null, Const.OFFER_PENDING,
                    "对物品 " + itemId + " 发起报价");
            return id;
        });
    }

    public static List<Offer> received(long userId, Integer status) {
        return OfferDao.listReceived(userId, status);
    }

    public static List<Offer> sent(long userId) {
        return OfferDao.listSent(userId);
    }

    /**
     * 处理报价。action = accept / reject / counter / cancel。
     * 接受走事务：改报价状态、生成交换单、写两条明细、锁两件物品，一步都不能少。
     */
    public static Map<String, Object> handle(long userId, long offerId, String action, Long newMyItemId) {
        Offer o = OfferDao.findById(offerId);
        if (o == null) {
            throw BizException.notFound("报价不存在");
        }
        String act = Str.isBlank(action) ? "" : action.trim().toLowerCase();
        if (!"accept".equals(act) && !"reject".equals(act) && !"counter".equals(act)
                && !"cancel".equals(act)) {
            throw new BizException(400, "不支持的操作，只能是 accept / reject / counter / cancel");
        }
        if ("cancel".equals(act)) {
            if (!o.fromUser.equals(userId)) {
                throw BizException.forbidden("只能撤回自己发出的报价");
            }
        } else if (!o.toUser.equals(userId)) {
            throw BizException.forbidden("只有物品主人能处理这条报价");
        }
        if (o.status != Const.OFFER_PENDING) {
            throw new BizException(400, "这条报价已经处理过了，当前状态：" + o.statusText);
        }
        if (o.expireTime != null && o.expireTime.isBefore(LocalDateTime.now())) {
            OfferDao.updateStatus(offerId, Const.OFFER_EXPIRED);
            throw new BizException(400, "这条报价已超过 24 小时，自动失效了");
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("action", act);

        if ("accept".equals(act)) {
            Item target = ItemDao.findById(o.itemId);
            Item mine = ItemDao.findById(o.myItemId);
            if (target == null || target.status != Const.ITEM_ON) {
                throw new BizException(400, "目标物品已不在架，无法接受");
            }
            if (mine == null || mine.status != Const.ITEM_ON) {
                throw new BizException(400, "对方的物品已不在架，无法接受");
            }
            long exchangeId = DBUtil.tx(c -> {
                long[] itemIds={o.itemId,o.myItemId}; java.util.Arrays.sort(itemIds);
                for(long id:itemIds) { Integer status=DBUtil.queryOne(c,"SELECT status FROM item WHERE id=? AND deleted=0 AND is_demo=0 FOR UPDATE",rs->rs.getInt(1),id); if(status==null||status!=Const.ITEM_ON)throw new BizException(400,"物品状态已变化，请重新查看"); }
                Integer offerStatus=DBUtil.queryOne(c,"SELECT status FROM offers WHERE id=? FOR UPDATE",rs->rs.getInt(1),offerId);
                if(offerStatus==null||offerStatus!=Const.OFFER_PENDING)throw new BizException(400,"报价已处理");
                OfferDao.updateStatus(c, offerId, Const.OFFER_ACCEPTED);
                long eid = ExchangeService.createOneToOne(c, o);
                NotificationService.send(c,o.fromUser,"报价已接受","对方接受了你的报价，请查看交换单。","#/exchange/"+eid);
                // 同一件物品被接受后，其他待响应报价自动失效
                OfferDao.invalidateByItems(c, o.itemId, o.myItemId);
                BizLogDao.log(c, userId, "EXCHANGE", eid, null, Const.EX_WAIT_DELIVER,
                        "接受报价 " + offerId + "，生成一对一交换单");
                return eid;
            });
            data.put("exchangeId", exchangeId);
            data.put("msg", "已接受，记得约时间面交");
            return data;
        }

        if ("reject".equals(act)) {
            DBUtil.tx(c -> {
                Integer offerStatus = OfferDao.lockStatus(c, offerId);
                if (offerStatus == null || offerStatus != Const.OFFER_PENDING) {
                    throw new BizException(400, "报价已处理，请刷新查看");
                }
                OfferDao.updateStatus(c, offerId, Const.OFFER_REJECTED);
                BizLogDao.log(c, userId, "OFFER", offerId, Const.OFFER_PENDING, Const.OFFER_REJECTED, "拒绝报价");
                NotificationService.send(c, o.fromUser, "报价未被接受", "对方暂未接受你的报价。", "#/offers");
                return null;
            });
            data.put("msg", "已拒绝这条报价");
            return data;
        }

        if ("counter".equals(act)) {
            if (newMyItemId == null) {
                throw new BizException(400, "还价要选一件你自己的物品");
            }
            if (newMyItemId.equals(o.myItemId)) {
                throw new BizException(400, "这件物品对方已经在换了，换一件吧");
            }
            long newOfferId = DBUtil.tx(c -> {
                long[] itemIds = {o.myItemId, newMyItemId};
                java.util.Arrays.sort(itemIds);
                for (long iid : itemIds) {
                    Integer itemStatus = DBUtil.queryOne(c,
                            "SELECT status FROM `item` WHERE id=? AND deleted=0 AND is_demo=0 FOR UPDATE",
                            rs -> rs.getInt(1), iid);
                    if (itemStatus == null || itemStatus != Const.ITEM_ON) {
                        throw new BizException(400, "物品状态已变化，无法还价");
                    }
                }
                Integer offerStatus = OfferDao.lockStatus(c, offerId);
                if (offerStatus == null || offerStatus != Const.OFFER_PENDING) {
                    throw new BizException(400, "报价已处理，请刷新查看");
                }
                Item counterItem = ItemDao.findById(c, newMyItemId);
                if (counterItem == null) {
                    throw BizException.notFound("你选的物品不存在");
                }
                if (!counterItem.ownerId.equals(userId)) {
                    throw BizException.forbidden("还价只能用你自己的物品");
                }
                OfferDao.updateStatus(c, offerId, Const.OFFER_COUNTERED);
                Offer counter = new Offer();
                counter.itemId = o.myItemId;
                counter.myItemId = newMyItemId;
                counter.fromUser = userId;
                counter.toUser = o.fromUser;
                counter.message = "还价：用「" + counterItem.title + "」换你的「" + o.myTitle + "」";
                counter.status = Const.OFFER_PENDING;
                counter.parentId = offerId;
                counter.expireTime = LocalDateTime.now().plusHours(Const.OFFER_EXPIRE_HOURS);
                long id = OfferDao.insert(c, counter);
                ItemDao.incrOfferCount(c, counter.itemId);
                NotificationService.send(c, o.fromUser, "收到还价", "对方提出了新的交换方案。", "#/offers");
                BizLogDao.log(c, userId, "OFFER", offerId, Const.OFFER_PENDING, Const.OFFER_COUNTERED,
                        "还价，生成新报价 " + id);
                return id;
            });
            data.put("newOfferId", newOfferId);
            data.put("msg", "已还价，等对方回应");
            return data;
        }

        // cancel
        DBUtil.tx(c -> {
            Integer offerStatus = OfferDao.lockStatus(c, offerId);
            if (offerStatus == null || offerStatus != Const.OFFER_PENDING) {
                throw new BizException(400, "报价已处理，无法撤回");
            }
            OfferDao.updateStatus(c, offerId, Const.OFFER_CANCELED);
            BizLogDao.log(c, userId, "OFFER", offerId, Const.OFFER_PENDING, Const.OFFER_CANCELED, "撤回报价");
            NotificationService.send(c, o.toUser, "报价已撤回", "对方撤回了一条报价。", "#/offers");
            return null;
        });
        data.put("msg", "已撤回");
        return data;
    }

    /** 定时任务：超时 24 小时的报价自动失效 */
    public static int expireAll() {
        return OfferDao.expireAll();
    }
}
