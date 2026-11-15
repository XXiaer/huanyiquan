package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ExchangeDao;
import com.huanyiquan.dao.ExchangeDetailDao;
import com.huanyiquan.dao.IntentDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.CycleEdge;
import com.huanyiquan.entity.Exchange;
import com.huanyiquan.entity.ExchangeDetail;
import com.huanyiquan.entity.Intent;
import com.huanyiquan.entity.Item;
import com.huanyiquan.entity.User;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 三方换物环匹配。产品的核心差异点。
 *
 * 找的是这样一条闭环：我把 I0 给 B，B 把 I1 给 C，C 把 I2 给我。
 * 对应三次查询：
 *   1. 谁想要 I0  → 得到 (B, I1)
 *   2. 我想要什么  → 得到 (C, I2)
 *   3. C 用 I2 想不想要 I1 → 是，则闭环成立
 */
public final class CycleService {

    /** 单次匹配最多检查多少组合，防止关系表大了拖死库 */
    private static final int MAX_CHECK = 300;

    private CycleService() {
    }

    /** 对外接口：返回最多 3 组候选，只查不加锁。 */
    public static List<Map<String, Object>> find(long userId, long itemId) {
        List<Ring> rings = search(userId, itemId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Ring r : rings) {
            out.add(toJson(r));
        }
        return out;
    }

    /** 用户从候选里挑一组，正式成环。这一步才锁物品。 */
    public static long createRing(long userId, long itemId, List<Long> itemIds) {
        if (itemIds == null || itemIds.size() != 3) {
            throw new BizException(400, "要选三件物品才能成环");
        }
        Set<Long> want = new HashSet<>(itemIds);
        if (want.size() != 3) {
            throw new BizException(400, "三件物品不能重复");
        }
        if (!want.contains(itemId)) {
            throw new BizException(400, "要包含你发起时选的那件物品");
        }
        Ring hit = null;
        for (Ring r : search(userId, itemId)) {
            if (r.itemIds().equals(want)) {
                hit = r;
                break;
            }
        }
        if (hit == null) {
            throw new BizException(400, "这组换法已经不可用了，重新找一次吧");
        }
        final Ring ring = hit;

        return DBUtil.tx(c -> {
            // 事务内再核一次三件物品状态，防止并发被别人先锁走
            long[] ids = {ring.i0.id, ring.i1.id, ring.i2.id};
            java.util.Arrays.sort(ids);
            for (long id : ids) {
                Integer status=DBUtil.queryOne(c,"SELECT status FROM item WHERE id=? AND deleted=0 AND allow_cycle=1 AND is_demo=0 FOR UPDATE",rs->rs.getInt(1),id);
                if(status==null || status!=Const.ITEM_ON) throw new BizException(400,"有物品已经不在架上了，重新找一次吧");
            }
            Exchange e = new Exchange();
            e.type = 3;
            e.status = Const.EX_WAIT_CONFIRM;
            long eid = ExchangeDao.insert(c, e);

            insertDetail(c, eid, ring.a.id, ring.i0.id, ring.i2.id);
            insertDetail(c, eid, ring.b.id, ring.i1.id, ring.i0.id);
            insertDetail(c, eid, ring.c.id, ring.i2.id, ring.i1.id);
            NotificationService.exchange(c,eid,userId,"收到三方交换邀请","有人发起了三方交换，请查看并确认。 ");

            for (long id : ids) {
                ItemDao.updateStatus(c, id, Const.ITEM_LOCKED);
                BizLogDao.log(c, userId, "ITEM", id, Const.ITEM_ON, Const.ITEM_LOCKED,
                        "三方环落单，物品锁定");
            }
            BizLogDao.log(c, userId, "EXCHANGE", eid, null, Const.EX_WAIT_CONFIRM,
                    "三方环匹配成功，等待三方确认");
            return eid;
        });
    }

    private static void insertDetail(java.sql.Connection c, long exchangeId, long userId,
                                     long giveItemId, long getItemId) {
        ExchangeDetail d = new ExchangeDetail();
        d.exchangeId = exchangeId;
        d.userId = userId;
        d.giveItemId = giveItemId;
        d.getItemId = getItemId;
        ExchangeDetailDao.insert(c, d);
    }

    // ------------------------------------------------------------------ 内部

    private static List<Ring> search(long userId, long itemId) {
        Item mine = ItemDao.findById(itemId);
        if (mine == null) {
            throw BizException.notFound("物品不存在");
        }
        if (!mine.ownerId.equals(userId)) {
            throw BizException.forbidden("只能给自己的物品找换法");
        }
        if (!Boolean.TRUE.equals(mine.allowCycle) || Boolean.TRUE.equals(mine.isDemo)) throw BizException.badRequest("该物品未开启闭环交换");
        if (mine.status != Const.ITEM_ON) {
            throw new BizException(400, "这件物品不在架上，先重新上架");
        }
        User me = UserDao.findById(userId);
        if (me == null || me.status == null || me.status != 1 || me.credit == null || me.credit < Const.CREDIT_MIN_TO_PUBLISH) {
            throw BizException.forbidden("信用分低于 60，暂时不能用换物环");
        }
        Map<Long, List<WishService.RelayWish>> relay = new HashMap<>();
        for (WishService.RelayWish wish : WishService.relayWishes()) {
            relay.computeIfAbsent(wish.itemId, ignored -> new ArrayList<>()).add(wish);
        }
        Map<Long, CycleEdge> incoming = new LinkedHashMap<>();
        for (CycleEdge edge : IntentDao.findWanters(itemId, mine.category, userId)) {
            incoming.put(edge.itemId, edge);
        }
        for (List<WishService.RelayWish> wishes : relay.values()) {
            for (WishService.RelayWish wish : wishes) {
                if (wish.owner == userId || !wish.wants(mine)) continue;
                CycleEdge edge = new CycleEdge();
                edge.itemId = wish.itemId;
                edge.userId = wish.owner;
                incoming.putIfAbsent(edge.itemId, edge);
            }
        }
        Map<Long,Item> choices = new LinkedHashMap<>();
        List<WishService.RelayWish> myWishes = relay.get(itemId);
        if (myWishes != null) {
            for (WishService.RelayWish wish : myWishes) {
                for (Item candidate : ItemDao.listWanted(null,wish.category,userId,200)) {
                    if (wish.wants(candidate)) choices.put(candidate.id,candidate);
                }
            }
        }
        List<Intent> myIntents = IntentDao.findAllByItemId(itemId);
        if (myIntents.isEmpty() && (myWishes == null || myWishes.isEmpty())) {
            throw new BizException(400, "请先填写期望的物品类别");
        }
        for (Intent intent : myIntents) {
            for (Item candidate : ItemDao.listWanted(intent.wantItemId,intent.wantCategory,userId,200)) {
                choices.putIfAbsent(candidate.id,candidate);
            }
        }
        List<Item> secondHop = new ArrayList<>(choices.values());

        List<Ring> rings = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int checked = 0;

        for (CycleEdge edge : incoming.values()) {
            if (rings.size() >= Const.MAX_CYCLES || checked >= MAX_CHECK) {
                break;
            }
            if (edge.itemId.equals(itemId) || edge.userId.equals(userId)) {
                continue;
            }
            Item i1 = ItemDao.findById(edge.itemId);
            if (i1 == null || i1.status != Const.ITEM_ON) {
                continue;
            }
            User b = UserDao.findById(edge.userId);
            if (b == null || b.status == null || b.status != 1
                    || b.credit == null || b.credit < Const.CREDIT_MIN_TO_PUBLISH) {
                continue;
            }
            for (Item i2 : secondHop) {
                if (rings.size() >= Const.MAX_CYCLES || checked >= MAX_CHECK) {
                    break;
                }
                checked++;
                if (i2.id.equals(itemId) || i2.id.equals(i1.id)) {
                    continue;
                }
                if (i2.ownerId.equals(userId) || i2.ownerId.equals(edge.userId)) {
                    continue;
                }
                User cUser = UserDao.findById(i2.ownerId);
                if (cUser == null || cUser.status == null || cUser.status != 1
                        || cUser.credit == null || cUser.credit < Const.CREDIT_MIN_TO_PUBLISH) {
                    continue;
                }
                // 第三条边：C 用自己那件物品，想不想要 B 的物（兼容普通分类意向与接力心愿）
                List<WishService.RelayWish> finalWishes = relay.get(i2.id);
                boolean wanted = IntentDao.wantsWithItem(cUser.id, i2.id, i1.id, i1.category)
                        || (finalWishes != null && finalWishes.stream().anyMatch(wish -> wish.wants(i1)));
                if (!wanted) {
                    continue;
                }
                String key = mine.id + ":" + i1.id + ":" + i2.id;
                if (!seen.add(key)) {
                    continue;
                }
                rings.add(new Ring(me, b, cUser, mine, i1, i2));
            }
        }
        return rings;
    }

    private static Map<String, Object> toJson(Ring r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("users", Arrays.asList(briefUser(r.a), briefUser(r.b), briefUser(r.c)));
        m.put("items", Arrays.asList(briefItem(r.i0), briefItem(r.i1), briefItem(r.i2)));
        m.put("itemIds", Arrays.asList(r.i0.id, r.i1.id, r.i2.id));
        m.put("flow", "我把「" + r.i0.title + "」给 " + r.b.nickname
                + "，" + r.b.nickname + " 把「" + r.i1.title + "」给 " + r.c.nickname
                + "，" + r.c.nickname + " 把「" + r.i2.title + "」给我");
        m.put("explain", "三个人各出一件、各得一件，任意两人单独谈都谈不成，凑成闭环就都成了");
        m.put("place", suggestPlace(r.a, r.b, r.c));
        return m;
    }

    private static Map<String, Object> briefUser(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.id);
        m.put("nickname", u.nickname);
        m.put("building", u.building);
        m.put("college", u.college);
        m.put("credit", u.credit);
        return m;
    }

    private static Map<String, Object> briefItem(Item it) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", it.id);
        m.put("title", it.title);
        m.put("category", it.category);
        m.put("conditionLevel", it.conditionLevel);
        m.put("images", it.images);
        return m;
    }

    /** 面交点取三人宿舍楼里出现最多的那栋，没有就退回校内公共区域 */
    private static String suggestPlace(User a, User b, User c) {
        Map<String, Integer> count = new HashMap<>();
        for (User u : Arrays.asList(a, b, c)) {
            if (u != null && Str.hasText(u.building)) {
                count.merge(u.building.trim(), 1, Integer::sum);
            }
        }
        String best = null;
        int max = 0;
        for (Map.Entry<String, Integer> e : count.entrySet()) {
            if (e.getValue() > max) {
                max = e.getValue();
                best = e.getKey();
            }
        }
        String where = best == null ? "校内公共区域" : best + " 楼下的食堂门口或快递点";
        return "建议面交：" + where + "，今日 18:00-19:00 或明日 12:00-13:00 均可";
    }

    /** 一组环的完整数据 */
    private static final class Ring {
        final User a;
        final User b;
        final User c;
        final Item i0;
        final Item i1;
        final Item i2;

        Ring(User a, User b, User c, Item i0, Item i1, Item i2) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.i0 = i0;
            this.i1 = i1;
            this.i2 = i2;
        }

        Set<Long> itemIds() {
            Set<Long> s = new HashSet<>();
            s.add(i0.id);
            s.add(i1.id);
            s.add(i2.id);
            return s;
        }
    }
}
