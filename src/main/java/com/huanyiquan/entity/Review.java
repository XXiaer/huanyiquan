package com.huanyiquan.entity;

import java.time.LocalDateTime;

/** 互评。一条交换单里，一个人对同一对象只能评一次。 */
public class Review {

    public Long id;
    public Long exchangeId;
    public Long fromUser;
    public Long toUser;
    /** 1-5 星 */
    public Integer score;
    public String content;
    public LocalDateTime createTime;

    /** 附加：评价人昵称 */
    public String fromNickname;
}
