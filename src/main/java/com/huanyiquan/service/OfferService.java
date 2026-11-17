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

    /** 发起换物或校园面交提案，并在同一事务内绑定私聊。 */
    public static Map<String, Object> create(long userId, long itemId, Long myItemId, Long amountCents, String message) {
        User me = UserDao.findById(userId);
        if (me == null) throw BizException.notFound("用户不存在");
        if (me.credit == null || me.credit < Const.CREDIT_MIN_TO_PUBLISH) {
            throw BizException.forbidden("信用分低于 60，暂时不能发起交易提案");
        }
        String msg = Str.cut(message, 50);
        SensitiveWordDao.check(msg, "留言");

        return DBUtil.tx(c -> {
            lockAvailableItems(c, itemId, myItemId);
            Item target = ItemDao.findById(c, itemId);
            if (target.ownerId.equals(userId)) {
                throw BizException.badRequest("不能给自己的物品发提案");
            }
            Item mine = null;
            if (amountCents != null) {
                checkCashAmount(target, amountCents);
            } else {
                if (Integer.valueOf(1).equals(target.tradeMode)) {
                    throw BizException.badRequest("发布者只接受出售，请使用面交出价");
                }
                mine = ItemDao.findById(c, myItemId);
                if (!mine.ownerId.equals(userId)) throw BizException.forbidden("只能用自己的物品交换");
            }
            long conversation = ConversationService.ensure(c, itemId, target.ownerId, userId);
            if (OfferDao.hasPending(c, conversation, itemId, userId, target.ownerId)) {
                throw BizException.badRequest("还有待回应的提案，请在聊天里查看");
            }
            Offer offer = buildOffer(target, mine, userId, target.ownerId, conversation, amountCents, msg);
            long id = OfferDao.insert(c, offer);
            OfferDao.setRootOfferId(c, id, id);
            ItemDao.incrOfferCount(c, itemId);
            recordProposal(c, offer, false);
            BizLogDao.log(c, userId, "OFFER", id, null, Const.OFFER_PENDING, "对物品 " + itemId + " 发起交易提案");
            return Map.of("offerId", id, "conversationId", conversation);
        });
    }

    private static Offer buildOffer(Item target, Item mine, long from, long to, Long conversation,
                                    Long amountCents, String message) {
        Offer offer = new Offer();
        offer.itemId = target.id;
        offer.myItemId = mine == null ? null : mine.id;
        offer.amountCents = amountCents;
        offer.conversationId = conversation;
        offer.fromUser = from;
        offer.toUser = to;
        offer.message = message;
        offer.status = Const.OFFER_PENDING;
        offer.targetTitleSnap = Str.cut(target.title, 100);
        offer.targetThumbSnap = Str.cut(firstThumb(target.images), 255);
        offer.targetCondSnap = Str.cut(target.conditionLevel, 30);
        if (mine != null) {
            offer.myTitleSnap = Str.cut(mine.title, 100);
            offer.myThumbSnap = Str.cut(firstThumb(mine.images), 255);
            offer.myCondSnap = Str.cut(mine.conditionLevel, 30);
        }
        offer.expireTime = LocalDateTime.now().plusHours(Const.OFFER_EXPIRE_HOURS);
        return offer;
    }

    private static void lockAvailableItems(java.sql.Connection c, long item, Long other) {
        long[] ids = other == null ? new long[]{item} : new long[]{item, other};
        java.util.Arrays.sort(ids);
        for (long id : ids) {
            Integer status = DBUtil.queryOne(c,
                    "SELECT status FROM item WHERE id=? AND deleted=0 AND is_demo=0 FOR UPDATE",
                    rs -> rs.getInt(1), id);
            if (status == null || status != Const.ITEM_ON) {
                throw BizException.badRequest("物品已不在架或仅供展示，请重新选择");
            }
        }
    }

    private static void checkCashAmount(Item target, Long amountCents) {
        if (target.price == null || target.price <= 0 || Integer.valueOf(2).equals(target.tradeMode)) {
            throw BizException.badRequest("这件物品只接受以物换物");
        }
        if (amountCents == null || amountCents <= 0 || amountCents > target.price) {
            throw BizException.badRequest("出价应大于零、并且不超过标价");
        }
        if (!Boolean.TRUE.equals(target.allowBargain) && amountCents.longValue() != target.price.longValue()) {
            throw BizException.badRequest("发布者只接受标价面交");
        }
    }

    private static String offerLink(Offer offer) {
        return offer.conversationId == null ? "#/offers" : "#/chat/" + offer.conversationId;
    }

    private static String displayAmount(long cents) {
        return "¥" + java.math.BigDecimal.valueOf(cents, 2).toPlainString();
    }

    private static void recordProposal(java.sql.Connection c, Offer offer, boolean counter) {
        if (offer.conversationId == null) return;
        String action = offer.amountCents != null ? "面交出价" : "换物提案";
        String proposalText = offer.amountCents != null
                ? displayAmount(offer.amountCents) + " 面交「" + offer.targetTitleSnap + "」"
                : "用「" + offer.myTitleSnap + "」换「" + offer.targetTitleSnap + "」";
        if (Str.hasText(offer.message)) proposalText += "\n留言：" + offer.message;
        ConversationService.recordProposal(c, offer.conversationId, offer.fromUser, offer.toUser,
                (counter ? "反提案：" : action + "：") + proposalText, counter ? "收到反提案" : "收到" + action);
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
    public static Map<String, Object> handle(long userId, long offerId, String action, Long newMyItemId, Long amountCents) {
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
            throw BizException.forbidden("只有收到提案的人能处理这条提案");
        }
        if (o.status != Const.OFFER_PENDING) {
            throw new BizException(400, "这条报价已经处理过了，当前状态：" + o.statusText);
        }
        if (o.expireTime != null && o.expireTime.isBefore(LocalDateTime.now())) {
            DBUtil.update("UPDATE offers SET status=?,handle_time=NOW() WHERE id=? AND status=?",
                    Const.OFFER_EXPIRED, offerId, Const.OFFER_PENDING);
            throw new BizException(400, "这条报价已超过 24 小时，自动失效了");
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("action", act);

        if ("accept".equals(act)) {
            long exchangeId = DBUtil.tx(c -> {
                lockAvailableItems(c, o.itemId, o.myItemId);
                lockPendingOffer(c, o);
                Item target = ItemDao.findById(c, o.itemId);
                if (o.amountCents != null) checkCashAmount(target, o.amountCents);
                else if (ItemDao.findById(c, o.myItemId).ownerId.equals(target.ownerId)) {
                    throw BizException.badRequest("物品归属已变化，请重新发起提案");
                }
                OfferDao.updateStatus(c, offerId, Const.OFFER_ACCEPTED);
                long eid = ExchangeService.createOneToOne(c, o, target.ownerId);
                NotificationService.send(c,o.fromUser,"提案已接受","对方接受了你的提案，请查看交易单并约面交。","#/exchange/"+eid);
                OfferDao.invalidateByItems(c, o.itemId, o.myItemId);
                BizLogDao.log(c, userId, "EXCHANGE", eid, null, Const.EX_WAIT_DELIVER,
                        "接受提案 " + offerId + "，生成校园面交单");
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
                NotificationService.send(c, o.fromUser, "提案未被接受", "对方暂未接受你的提案。", offerLink(o));
                return null;
            });
            data.put("msg", "已拒绝这条报价");
            return data;
        }

        if ("counter".equals(act)) {
            boolean cash = o.amountCents != null;
            if (cash && amountCents == null) throw BizException.badRequest("请填写新的面交出价");
            if (!cash && newMyItemId == null) throw BizException.badRequest("请选一件自己的物品作为反提案");
            if (cash && Objects.equals(amountCents, o.amountCents)) throw BizException.badRequest("新价格与上一版相同");
            if (!cash && newMyItemId.equals(o.myItemId)) throw BizException.badRequest("请选择另一件物品");
            long nextId = DBUtil.tx(c -> {
                lockAvailableItems(c, cash ? o.itemId : o.myItemId, cash ? null : newMyItemId);
                lockPendingOffer(c, o);
                Item target = ItemDao.findById(c, cash ? o.itemId : o.myItemId);
                Item counterItem = null;
                if (cash) {
                    if (!Boolean.TRUE.equals(target.allowBargain)) throw BizException.badRequest("这件物品只支持按标价面交");
                    checkCashAmount(target, amountCents);
                } else {
                    counterItem = ItemDao.findById(c, newMyItemId);
                    if (!counterItem.ownerId.equals(userId)) {
                        throw BizException.forbidden("反提案只能用你自己的物品");
                    }
                }
                long rootId = o.rootOfferId != null ? o.rootOfferId : offerId;
                if (o.rootOfferId == null) OfferDao.setRootOfferId(c, offerId, rootId);
                OfferDao.updateStatus(c, offerId, Const.OFFER_COUNTERED);
                Offer counter = buildOffer(target, counterItem, userId, o.fromUser,
                        o.conversationId, cash ? amountCents : null, null);
                counter.parentId = offerId;
                counter.rootOfferId = rootId;
                long id = OfferDao.insert(c, counter);
                ItemDao.incrOfferCount(c, counter.itemId);
                if (counter.conversationId == null) {
                    NotificationService.send(c, o.fromUser, "收到反提案", "对方提出了新的换物提案。", "#/offers");
                } else {
                    recordProposal(c, counter, true);
                }
                BizLogDao.log(c, userId, "OFFER", offerId, Const.OFFER_PENDING, Const.OFFER_COUNTERED,
                        "更新交易提案 " + id);
                return id;
            });
            data.put("newOfferId", nextId);
            data.put("msg", "反提案已发出，等待对方回应");
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
            NotificationService.send(c, o.toUser, "提案已撤回", "对方撤回了一条提案。", offerLink(o));
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
                if (cur.amountCents != null && prev.amountCents != null && !cur.amountCents.equals(prev.amountCents)) {
                    diff = "面交出价由 " + displayAmount(prev.amountCents) + " 改为 " + displayAmount(cur.amountCents);
                } else if (cur.amountCents == null && !Objects.equals(cur.myItemId, prev.itemId)) {
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
            node.put("amountCents", cur.amountCents);
            node.put("conversationId", cur.conversationId);
            node.put("exchangeId", cur.exchangeId);
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

    private static void lockPendingOffer(java.sql.Connection c, Offer offer) {
        Integer status = OfferDao.lockStatus(c, offer.id);
        if (status == null || status != Const.OFFER_PENDING) {
            throw BizException.badRequest("提案已处理，请刷新查看");
        }
        if (offer.expireTime != null && !offer.expireTime.isAfter(LocalDateTime.now())) {
            throw BizException.badRequest("提案已过期，请重新发起");
        }
        assertLatestInThread(c, offer);
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
