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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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
            o.targetTitleSnap = Str.cut(target.title, 100);
            o.targetThumbSnap = Str.cut(firstThumb(target.images), 255);
            o.targetCondSnap = Str.cut(target.conditionLevel, 30);
            o.myTitleSnap = Str.cut(mine.title, 100);
            o.myThumbSnap = Str.cut(firstThumb(mine.images), 255);
            o.myCondSnap = Str.cut(mine.conditionLevel, 30);
            o.expireTime = LocalDateTime.now().plusHours(Const.OFFER_EXPIRE_HOURS);
            long id = OfferDao.insert(c, o);
            OfferDao.setRootOfferId(c, id, id);
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
                assertLatestInThread(c, o);
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
                assertLatestInThread(c, o);
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
                assertLatestInThread(c, o);
                Item counterItem = ItemDao.findById(c, newMyItemId);
                if (counterItem == null) {
                    throw BizException.notFound("你选的物品不存在");
                }
                if (!counterItem.ownerId.equals(userId)) {
                    throw BizException.forbidden("还价只能用你自己的物品");
                }
                Item prevTarget = ItemDao.findById(c, o.myItemId);
                long rootId = o.rootOfferId != null ? o.rootOfferId : offerId;
                if (o.rootOfferId == null) {
                    OfferDao.setRootOfferId(c, offerId, rootId);
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
                counter.rootOfferId = rootId;
                counter.targetTitleSnap = Str.cut(prevTarget != null ? prevTarget.title : o.myTitle, 100);
                counter.targetThumbSnap = Str.cut(prevTarget != null ? firstThumb(prevTarget.images) : o.myThumbSnap, 255);
                counter.targetCondSnap = Str.cut(prevTarget != null ? prevTarget.conditionLevel : o.myCondSnap, 30);
                counter.myTitleSnap = Str.cut(counterItem.title, 100);
                counter.myThumbSnap = Str.cut(firstThumb(counterItem.images), 255);
                counter.myCondSnap = Str.cut(counterItem.conditionLevel, 30);
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
            assertLatestInThread(c, o);
            OfferDao.updateStatus(c, offerId, Const.OFFER_CANCELED);
            BizLogDao.log(c, userId, "OFFER", offerId, Const.OFFER_PENDING, Const.OFFER_CANCELED, "撤回报价");
            NotificationService.send(c, o.toUser, "报价已撤回", "对方撤回了一条报价。", "#/offers");
            return null;
        });
        data.put("msg", "已撤回");
        return data;
    }

    /** 查询提案链完整历史，仅参与者可见 */
    public static List<Map<String, Object>> history(long userId, long offerId) {
        Offer anchor = OfferDao.findById(offerId);
        if (anchor == null) {
            throw BizException.notFound("提案不存在");
        }
        long rootId = anchor.rootOfferId != null ? anchor.rootOfferId : resolveRootId(anchor);
        List<Offer> chain = OfferDao.listThread(rootId);
        boolean isParticipant = false;
        for (Offer row : chain) {
            if (Objects.equals(row.fromUser, userId) || Objects.equals(row.toUser, userId)) {
                isParticipant = true;
                break;
            }
        }
        if (!isParticipant) {
            throw BizException.forbidden("无权查看该提案历史");
        }
        List<Map<String, Object>> out = new ArrayList<>();
        Offer prev = null;
        for (int i = 0; i < chain.size(); i++) {
            Offer cur = chain.get(i);
            String curMy = Str.hasText(cur.myTitleSnap) ? cur.myTitleSnap : cur.myTitle;
            String curTarget = Str.hasText(cur.targetTitleSnap) ? cur.targetTitleSnap : cur.targetTitle;
            String diff = null;
            if (prev != null) {
                String prevTarget = Str.hasText(prev.targetTitleSnap) ? prev.targetTitleSnap : prev.targetTitle;
                if (!Objects.equals(cur.myItemId, prev.itemId)) {
                    diff = cur.fromNickname + " 把「" + prevTarget + "」换成了「" + curMy + "」";
                }
            }
            if (prev != null && !Objects.equals(
                    prev.message == null ? "" : prev.message.trim(),
                    cur.message == null ? "" : cur.message.trim())) {
                String messageChange = Str.isBlank(cur.message) ? "移除了留言"
                        : Str.isBlank(prev.message) ? "添加了留言" : "修改了留言";
                diff = diff == null ? messageChange : diff + "，" + messageChange;
            }
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", cur.id);
            node.put("round", i);
            node.put("label", i == 0 ? "初始提案" : "第 " + i + " 次反提案");
            node.put("fromUser", cur.fromUser);
            node.put("toUser", cur.toUser);
            node.put("fromNickname", cur.fromNickname);
            node.put("toNickname", cur.toNickname);
            node.put("itemId", cur.itemId);
            node.put("myItemId", cur.myItemId);
            node.put("targetTitle", curTarget);
            node.put("targetThumb", cur.targetThumbSnap);
            node.put("targetCond", cur.targetCondSnap);
            node.put("myTitle", curMy);
            node.put("myThumb", cur.myThumbSnap);
            node.put("myCond", cur.myCondSnap);
            node.put("message", cur.message);
            node.put("status", cur.status);
            node.put("statusText", cur.statusText);
            node.put("diffSummary", diff);
            node.put("isLatest", i == chain.size() - 1);
            node.put("createTime", cur.createTime != null ? cur.createTime.toString() : null);
            node.put("expireTime", cur.expireTime != null ? cur.expireTime.toString() : null);
            out.add(node);
            prev = cur;
        }
        return out;
    }

    private static void assertLatestInThread(java.sql.Connection c, Offer o) {
        if (o.rootOfferId == null) return;
        Long latest = OfferDao.latestIdInThread(c, o.rootOfferId);
        if (latest != null && !latest.equals(o.id)) {
            throw new BizException(400, "提案已更新，请核对最新版本");
        }
    }

    private static long resolveRootId(Offer start) {
        Offer cur = start;
        int guard = 0;
        while (cur.parentId != null && guard++ < 30) {
            Offer parent = OfferDao.findById(cur.parentId);
            if (parent == null) break;
            cur = parent;
        }
        return cur.id;
    }

    private static String firstThumb(String images) {
        if (Str.isBlank(images)) return "";
        String[] parts = images.split(",");
        return parts.length > 0 ? parts[0].trim() : "";
    }

    /** 定时任务：超时 24 小时的报价自动失效 */
    public static int expireAll() {
        return OfferDao.expireAll();
    }
}
