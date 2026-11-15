package com.huanyiquan.entity;

import java.time.LocalDateTime;

/** 交换单明细：一个人、换出一件、换入一件、两个确认位。 */
public class ExchangeDetail {

    public Long id;
    public Long exchangeId;
    public Long userId;
    public Long giveItemId;
    public Long getItemId;
    /** 是否已确认参与：1 是 */
    public Integer confirmed;
    /** 是否已确认收货：1 是 */
    public Integer delivered;
    public LocalDateTime confirmTime;
    public LocalDateTime deliverTime;

    /** 附加：人 + 两件物品的展示信息 */
    public String nickname;
    public String building;
    public String giveTitle;
    public String getTitle;
}
