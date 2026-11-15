package com.huanyiquan.service;

import com.huanyiquan.common.BizException;
import com.huanyiquan.common.Const;
import com.huanyiquan.common.Str;
import com.huanyiquan.dao.BizLogDao;
import com.huanyiquan.dao.ExchangeDao;
import com.huanyiquan.dao.ExchangeDetailDao;
import com.huanyiquan.dao.ReviewDao;
import com.huanyiquan.dao.SensitiveWordDao;
import com.huanyiquan.dao.UserDao;
import com.huanyiquan.db.DBUtil;
import com.huanyiquan.entity.Exchange;
import com.huanyiquan.entity.Review;
import com.huanyiquan.entity.User;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 互评与信用结算。评价一旦提交不可修改。 */
public final class ReviewService {

    private ReviewService() {
    }

    public static Map<String, Object> create(long userId, long exchangeId, long targetUserId,
                                             Integer score, String content) {
        if (score == null || score < 1 || score > 5) {
            throw new BizException(400, "打分只能是 1 到 5 星");
        }
        Exchange e = ExchangeDao.findById(exchangeId);
        if (e == null) {
            throw BizException.notFound("交换单不存在");
        }
        if (!ExchangeDetailDao.isMember(exchangeId, userId)) {
            throw BizException.forbidden("你不在这个交换单里，不能评价");
        }
        if (!ExchangeDetailDao.isMember(exchangeId, targetUserId)) {
            throw new BizException(400, "对方不在这张交换单里");
        }
        if (targetUserId == userId) {
            throw new BizException(400, "不能给自己打分");
        }
        if (e.status != Const.EX_DONE) {
            throw new BizException(400, "交换还没完成，先完成交付再评价");
        }
        if (ReviewDao.exists(exchangeId, userId, targetUserId)) {
            throw new BizException(400, "你已经评价过对方了，评价不能改");
        }
        String text = Str.cut(content, 100);
        SensitiveWordDao.check(text, "评价内容");

        Review r = new Review();
        r.exchangeId = exchangeId;
        r.fromUser = userId;
        r.toUser = targetUserId;
        r.score = score;
        r.content = text;

        // 信用分按「星级 - 3」结算：5 星 +2，3 星不变，1 星 −2
        int delta = score - 3;
        DBUtil.tx(c -> {
            ReviewDao.insert(c, r);
            UserDao.addCredit(c, targetUserId, delta);
            BizLogDao.log(c, userId, "USER", targetUserId, null, null,
                    "收到 " + score + " 星评价，信用分 " + (delta >= 0 ? "+" : "") + delta);
            return null;
        });

        User target = UserDao.findById(targetUserId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("score", score);
        data.put("credit", target == null ? null : target.credit);
        data.put("msg", "评价成功，谢谢你让平台更可信");
        return data;
    }

    public static List<Review> listByUser(long userId) {
        return ReviewDao.listByTarget(userId);
    }

    /** 我参与完成、但还没评价对方的交换单，用于「待评价」和主页的「评价 TA」 */
    public static List<Map<String, Object>> pending(long userId) {
        return ReviewDao.listPending(userId);
    }
}
