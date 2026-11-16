package com.huanyiquan.entity;

import java.time.LocalDateTime;
import java.util.List;

/** 交换单。type=1 一对一，type=3 三方环。 */
public class Exchange {

    public Long id;
    public Integer type;
    /** 1 待确认 / 2 待交付 / 3 已完成 / 4 已失效 / 5 已超时关闭 */
    public Integer status;
    public String place;
    public String dealTime;
    public Long offerId;
    public Long confirmedArrangementId;
    public Long pendingArrangementId;
    public LocalDateTime createTime;
    public LocalDateTime finishTime;

    /** 详情附加：明细行 */
    public List<ExchangeDetail> details;
    /** 详情附加：我在这张单里的角色 */
    public ExchangeDetail mine;
    /** 详情附加：已确认生效的面交安排 */
    public java.util.Map<String, Object> confirmedArrangement;
    /** 详情附加：待全员确认的面交提议 */
    public java.util.Map<String, Object> pendingArrangement;
    /** 详情附加：需要几个人确认 */
    public Integer needConfirm;
    /** 详情附加：已确认人数 */
    public Long confirmedCount;
    /** 详情附加：已交付人数 */
    public Long deliveredCount;
    public String statusText;
}
