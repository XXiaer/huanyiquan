package com.huanyiquan.entity;

import java.time.LocalDateTime;

/** 举报记录。举报人身份不对外暴露。 */
public class Report {

    public Long id;
    /** 1 物品 / 2 用户 */
    public Integer targetType;
    public Long targetId;
    public String reason;
    public Long reporterId;
    /** 0 待处理 / 1 已处理 / 2 已驳回 */
    public Integer status;
    public String handleNote;
    public LocalDateTime createTime;
    public LocalDateTime handleTime;

    /** 附加：展示用 */
    public String reporterNickname;
    public String targetTitle;
}
