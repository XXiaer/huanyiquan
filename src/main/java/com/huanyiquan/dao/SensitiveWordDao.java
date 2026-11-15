package com.huanyiquan.dao;

import com.huanyiquan.common.Const;
import com.huanyiquan.common.BizException;
import com.huanyiquan.db.DBUtil;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 敏感词 DAO + 内存缓存。
 * 词表很小，启动时读一次，定时任务每 10 分钟刷新，避免每发一条物品就查库。
 */
public final class SensitiveWordDao {

    private static volatile Set<String> BLOCK_WORDS = new HashSet<>();

    private SensitiveWordDao() {
    }

    public static void reload() {
        try {
            List<String> words = DBUtil.query("SELECT word FROM `sensitive_word` WHERE level=1",
                    rs -> rs.getString(1));
            Set<String> set = new HashSet<>(words);
            BLOCK_WORDS = set;
        } catch (Exception e) {
            System.err.println("[敏感词] 加载失败，沿用旧词表：" + e.getMessage());
        }
    }

    /** 命中就抛异常，直接拒绝。返回命中的词，方便前端提示具体位置。 */
    public static void check(String text, String fieldName) {
        if (text == null || text.isEmpty()) {
            return;
        }
        for (String w : BLOCK_WORDS) {
            if (!w.isEmpty() && text.contains(w)) {
                throw new BizException(Const.CODE_BAD_REQUEST,
                        fieldName + "含有不允许的词「" + w + "」，请修改后再提交");
            }
        }
    }
}
