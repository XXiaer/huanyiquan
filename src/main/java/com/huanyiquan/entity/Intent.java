package com.huanyiquan.entity;

import java.time.LocalDateTime;

/** 换物意向。环匹配全靠这张表。 */
public class Intent {

    public Long id;
    public Long userId;
    public Long itemId;
    /** 想换的类别，可空 */
    public String wantCategory;
    /** 想换的具体物品，可空 */
    public Long wantItemId;
    public LocalDateTime createTime;
}
