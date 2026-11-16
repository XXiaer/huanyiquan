package com.huanyiquan.entity;

import java.time.LocalDateTime;

/** 报价单。24 小时过期，定时任务负责清扫。 */
public class Offer {

    public Long id;
    /** 目标物品 */
    public Long itemId;
    /** 我拿出去换的物品 */
    public Long myItemId;
    public Long fromUser;
    public Long toUser;
    public String message;
    /** 0 待响应 / 1 已接受 / 2 已拒绝 / 3 已失效 / 4 已撤回 / 5 已还价 */
    public Integer status;
    public Long parentId;
    public Long rootOfferId;
    public String targetTitleSnap;
    public String targetThumbSnap;
    public String targetCondSnap;
    public String myTitleSnap;
    public String myThumbSnap;
    public String myCondSnap;
    public LocalDateTime expireTime;
    public LocalDateTime createTime;
    public LocalDateTime handleTime;

    /** 列表附加字段 */
    public String targetTitle;
    public String myTitle;
    public String fromNickname;
    public Integer fromCredit;
    public String toNickname;
    public String statusText;
}
