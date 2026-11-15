package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.common.ImageCheck;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.IntentDao;
import com.huanyiquan.dao.ItemDao;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Intent;
import com.huanyiquan.entity.Item;
import com.huanyiquan.entity.User;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 物品：发布、编辑、下架、列表、详情。 */
public final class ItemService {

    public static final List<String> CATEGORIES =
            Arrays.asList("教材", "数码", "运动", "生活", "衣物", "绿植", "其他");
    public static final List<String> CONDITIONS =
            Arrays.asList("全新", "九成新", "七成新", "有使用痕迹");

    private ItemService() {
    }

    /**
     * 发布物品。物品和意向必须同事务写入，否则环匹配就少了原料。
     */
    public static long create(long userId, String title, String category, String conditionLevel,
                              String description, String images, String expectDesc,
                              String wantCategory, Long wantItemId, String matchMode) {
        User me = UserDao.findById(userId);
        if (me == null) {
            throw BizException.notFound("用户不存在");
        }
        if (me.status != null && me.status == 0) {
            throw BizException.forbidden("账号已被封禁，不能发布物品");
        }
        if (me.credit == null || me.credit < Const.CREDIT_MIN_TO_PUBLISH) {
            throw BizException.forbidden("信用分低于 60，暂时不能发布。完成一次交换可以回升");
        }
        if (ItemDao.countOnShelf(userId) >= Const.MAX_ON_SHELF) {
            throw new BizException(400, "在架物品已达 20 件上限，先下架几件吧");
        }

        String t = Str.trim(title);
        if (Str.isBlank(t)) {
            throw new BizException(400, "物品名称不能为空");
        }
        if (t.length() > 30) {
            throw new BizException(400, "物品名称不超过 30 个字");
        }
        if (!CATEGORIES.contains(category)) {
            throw new BizException(400, "请选择正确的类别");
        }
        if (!CONDITIONS.contains(conditionLevel)) {
            throw new BizException(400, "请选择正确的成色");
        }
        if (description != null && description.length() > 300) {
            throw new BizException(400, "描述不超过 300 个字");
        }
        if (expectDesc != null && expectDesc.length() > 100) {
            throw new BizException(400, "期望换物说明不超过 100 个字");
        }
        if (images != null && images.length() > 500) {
            throw new BizException(400, "图片数量太多了");
        }
        ImageCheck.requireImages(images);
        java.util.List<String> categories = parseWants(wantCategory, wantItemId);
        String mode = normalizeMode(matchMode, "passive");
        SensitiveWordDao.check(t, "物品名称");
        SensitiveWordDao.check(description, "描述");
        SensitiveWordDao.check(expectDesc, "期望换物");

        if (ItemDao.findRecentDuplicate(userId, t) != null) {
            throw new BizException(400, "刚刚已经发布过同名物品了，刷新页面看看");
        }

        return DBUtil.tx(c -> {
            Item it = new Item();
            it.ownerId = userId;
            it.allowCycle = !"one".equals(mode); it.autoMatch = "passive".equals(mode);
            it.title = t;
            it.category = category;
            it.conditionLevel = conditionLevel;
            it.description = Str.cut(description, 300);
            it.images = Str.trim(images);
            it.expectDesc = Str.cut(expectDesc, 100);
            it.status = Const.ITEM_PENDING;
            it.allowCycle = !"one".equals(mode); it.autoMatch = "passive".equals(mode);
            long itemId = ItemDao.insert(c, it);

            for (String cat : categories) {
                Intent want = new Intent(); want.userId=userId; want.itemId=itemId; want.wantCategory=cat; want.wantItemId=wantItemId; IntentDao.insert(c,want);
            }

            BizLogDao.log(c, userId, "ITEM", itemId, null, Const.ITEM_PENDING, "提交审核");
            return itemId;
        });
    }

    public static void update(long userId, long itemId, String title, String category,
                              String conditionLevel, String description, String images,
                              String expectDesc, String wantCategory, Long wantItemId, String matchMode) {
        Item it = ItemDao.findById(itemId);
        if (it == null) {
            throw BizException.notFound("物品不存在");
        }
        if (it.ownerId != userId) {
            throw BizException.forbidden("只能改自己的物品");
        }
        if (it.status != null && it.status == Const.ITEM_LOCKED) {
            throw new BizException(400, "这件物品正在交换中，先处理完交换单");
        }
        if (it.status != null && it.status == Const.ITEM_SWAPPED) {
            throw new BizException(400, "已换出的物品不能再改");
        }
        String t = Str.isBlank(title) ? it.title : title.trim();
        if (t.length() > 30) {
            throw new BizException(400, "物品名称不超过 30 个字");
        }
        SensitiveWordDao.check(t, "物品名称");
        SensitiveWordDao.check(description, "描述");

        String cat = category == null ? it.category : category;
        String cond = conditionLevel == null ? it.conditionLevel : conditionLevel;
        if (!CATEGORIES.contains(cat)) {
            throw new BizException(400, "请选择正确的类别");
        }
        if (!CONDITIONS.contains(cond)) {
            throw new BizException(400, "请选择正确的成色");
        }

        ImageCheck.requireImages(images == null ? it.images : images);
        final java.util.List<String> categories = wantCategory == null && wantItemId == null ? null : parseWants(wantCategory, wantItemId);
        String previousMode = !Boolean.TRUE.equals(it.allowCycle) ? "one" : (Boolean.TRUE.equals(it.autoMatch) ? "passive" : "active");
        String mode = normalizeMode(matchMode, previousMode);
        DBUtil.tx(c -> {
            it.allowCycle = !"one".equals(mode); it.autoMatch = "passive".equals(mode);
            it.title = t;
            it.category = cat;
            it.conditionLevel = cond;
            it.description = description == null ? it.description : Str.cut(description, 300);
            it.images = images == null ? it.images : Str.trim(images);
            it.expectDesc = expectDesc == null ? it.expectDesc : Str.cut(expectDesc, 100);
            ItemDao.updateFields(c, it);
            ItemDao.updateStatus(c, itemId, Const.ITEM_PENDING);

            if (categories != null) {
                IntentDao.deleteByItemId(c,itemId);
                for (String wanted : categories) { Intent want=new Intent();want.userId=userId;want.itemId=itemId;want.wantCategory=wanted;want.wantItemId=wantItemId;IntentDao.insert(c,want); }
            }
            return null;
        });
    }

    /** 上架 / 下架。锁定状态下不允许操作。 */
    public static void changeStatus(long userId, long itemId, int targetStatus) {
        Item it = ItemDao.findById(itemId);
        if (it == null) {
            throw BizException.notFound("物品不存在");
        }
        if (it.ownerId != userId) {
            throw BizException.forbidden("只能操作自己的物品");
        }
        if (it.status != null && it.status == Const.ITEM_LOCKED) {
            throw new BizException(400, "物品已锁定在交换单里，不能下架");
        }
        if (it.status != null && it.status == Const.ITEM_SWAPPED) {
            throw new BizException(400, "已换出的物品不能再上下架");
        }
        if (targetStatus == Const.ITEM_ON && ItemDao.countOnShelf(userId) >= Const.MAX_ON_SHELF) {
            throw new BizException(400, "在架物品已达 20 件上限");
        }
        if (targetStatus != Const.ITEM_ON && targetStatus != Const.ITEM_OFF) {
            throw new BizException(400, "只能上架或下架");
        }
        if (targetStatus == Const.ITEM_ON) { ImageCheck.requireImages(it.images); targetStatus = Const.ITEM_PENDING; }
        ItemDao.updateStatus(itemId, targetStatus);
        BizLogDao.log(userId, "ITEM", itemId, it.status, targetStatus,
                targetStatus == Const.ITEM_PENDING ? "重新提交审核" : "手动下架");
    }

    private static String normalizeMode(String mode,String fallback) { String m=mode==null||mode.trim().isEmpty()?fallback:mode.trim(); if(!java.util.Arrays.asList("one","active","passive").contains(m))throw BizException.badRequest("交换模式不正确");return m; }
    private static java.util.List<String> parseWants(String value,Long itemId) {
        java.util.LinkedHashSet<String> cats=new java.util.LinkedHashSet<>();
        if(value!=null)for(String part:value.split(",")){String c=part.trim();if(c.isEmpty()||"不限".equals(c))continue;if(!CATEGORIES.contains(c))throw BizException.badRequest("想换的类别不在可选范围内");cats.add(c);}
        if(cats.isEmpty()){if(itemId==null)throw BizException.badRequest("请选择至少一个期望品类");return java.util.Collections.singletonList(null);}
        return new java.util.ArrayList<>(cats);
    }

    public static void review(long adminId, long itemId, boolean approve) {
        DBUtil.tx(c -> {
            Item it = ItemDao.findById(c, itemId);
            if (it == null || it.status != Const.ITEM_PENDING) throw BizException.badRequest("物品不在待审核状态");
            if (approve) ImageCheck.requireImages(it.images);
            int next = approve ? Const.ITEM_ON : Const.ITEM_REJECTED;
            if (DBUtil.update(c, "UPDATE item SET status=? WHERE id=? AND status=? AND deleted=0", next,itemId,Const.ITEM_PENDING) != 1) throw BizException.badRequest("物品审核状态已变更");
            BizLogDao.log(c, adminId, "ITEM", itemId, Const.ITEM_PENDING, next, approve ? "审核通过" : "审核未通过");
            NotificationService.send(c,it.ownerId,approve?"物品审核通过":"物品审核未通过",approve?"你的物品已上架。":"请修改物品后重新提交。","#/item/"+itemId);
            return null;
        });
        if (approve) {
            PassiveMatchService.checkItemAsync(itemId);
        }
    }

    public static Map<String, Object> list(String category, String condition, String building,
                                           String keyword, int page, int size) {
        int p = Math.max(1, page);
        int s = size <= 0 ? 20 : Math.min(size, 50);
        int offset = (p - 1) * s;
        List<Item> list = ItemDao.list(category, condition, building, keyword,
                null, Const.ITEM_ON, offset, s);
        long total = ItemDao.countList(category, condition, building, keyword, null, Const.ITEM_ON);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("page", p);
        data.put("size", s);
        data.put("hasMore", (long) offset + list.size() < total);
        if (list.isEmpty()) {
            data.put("emptyTip", "这个条件下还没有物品，换个筛选条件试试，或者自己先发布一件");
        }
        return data;
    }

    public static Map<String, Object> detail(Long userId, long itemId) {
        Item it = ItemDao.findById(itemId);
        if (it == null) {
            throw BizException.notFound("物品不存在或已下架");
        }
        if ((it.status == Const.ITEM_PENDING || it.status == Const.ITEM_REJECTED) && (userId == null || !it.ownerId.equals(userId))) throw BizException.notFound("物品不存在");
        ItemDao.incrViewCount(itemId);

        java.util.List<Intent> wants = IntentDao.findAllByItemId(itemId);
        Intent want = wants.isEmpty()?null:wants.get(0);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("item", it);
        Map<String, Object> w = new LinkedHashMap<>();
        if (want != null) {
            w.put("wantCategory", want.wantCategory);
            w.put("wantItemId", want.wantItemId);
        }
        java.util.List<String> wantCategories=new java.util.ArrayList<>(); for(Intent entry:wants) if(entry.wantCategory!=null) wantCategories.add(entry.wantCategory);
        w.put("wantCategories",wantCategories);
        w.put("expectDesc", it.expectDesc);
        data.put("want", w);
        data.put("isMine", userId != null && it.ownerId.equals(userId));
        data.put("canOffer", userId != null && !it.ownerId.equals(userId)
                && it.status != null && it.status == Const.ITEM_ON && !Boolean.TRUE.equals(it.isDemo));
        data.put("tip", "面交建议：优先约在双方宿舍楼之间的公共区域，比如食堂门口或快递点");
        return data;
    }

    public static List<Item> mine(long userId, Integer status) {
        return ItemDao.list(null, null, null, null, userId, status, 0, 100);
    }

    /** 别人主页上看到的在架物品。下架和已换出的不展示。 */
    public static List<Item> listByOwner(long ownerId) {
        return ItemDao.list(null, null, null, null, ownerId, Const.ITEM_ON, 0, 20);
    }
}
