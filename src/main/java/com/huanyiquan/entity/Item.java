package com.huanyiquan.entity;

import java.time.LocalDateTime;

/** 物品。状态四值：1 在架 / 2 锁定 / 3 已换出 / 4 已下架。 */
public class Item {

    public Long id;
    public Long ownerId;
    public String title;
    public String category;
    public String conditionLevel;
    public String description;
    /** 图片路径，逗号分隔，只存路径不存二进制 */
    public String images;
    public String expectDesc;
    public Integer price;
    public Integer originalPrice;
    /** 1 明码标价 / 2 以物换物 / 3 拍卖 / 4 可买可换双轨 */
    public Integer tradeMode;
    public String place;
    public String wantText;
    public String brand;
    public String delivery;
    public Boolean allowBargain;
    public Integer status;
    public Boolean isDemo;
    public Boolean allowCycle;
    public Boolean autoMatch;
    public Integer offerCount;
    public Integer viewCount;
    public LocalDateTime createTime;
    public LocalDateTime updateTime;

    /** 列表 / 详情附加：发布人信息 */
    public String ownerNickname;
    public String ownerBuilding;
    public Integer ownerCredit;

    /** 前端直接用的中文状态 */
    public String statusText;
}
