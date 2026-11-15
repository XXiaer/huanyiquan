package com.huanyiquan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

/** 用户。密码与盐永远不进 JSON。 */
public class User {

    public Long id;
    public String studentNo;
    public String nickname;
    @JsonIgnore
    public String password;
    @JsonIgnore
    public String salt;
    public String college;
    public String building;
    /** 信用分，初始 80 */
    public Integer credit;
    /** 1 正常 / 0 封禁 */
    public Integer status;
    /** 0 普通 / 1 管理员 */
    public Integer role;
    @JsonIgnore
    public Integer failCount;
    @JsonIgnore
    public LocalDateTime lockUntil;
    public LocalDateTime lastLogin;
    public LocalDateTime createTime;

    /** 详情页附加：在架物品数 */
    public Long onShelfCount;
    /** 详情页附加：平均评分 */
    public Double avgScore;
    /** 详情页附加：评价条数 */
    public Long reviewCount;
    /** 详情页附加：成交单数（已完成的交换） */
    public Long dealCount;
    /** 详情页附加：好评率（4-5 星占比，0-100 的整数） */
    public Integer goodRate;
    /** 详情页附加：信用等级文案，如「优秀」「良好」 */
    public String creditLevel;

    /** 只在登录响应里带回来，供浏览器存本地存储；其他接口不会返回 */
    public String token;
}
