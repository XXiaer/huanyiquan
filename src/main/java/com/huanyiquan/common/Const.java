package com.huanyiquan.common;

/**
 * 全局状态常量。
 * 状态只能单向推进，禁止回退，所以这里只放常量，不放状态机工具。
 */
public final class Const {

    private Const() {
    }

    /** 物品：在架 */
    public static final int ITEM_ON = 1;
    /** 物品：锁定（交换单存在期间） */
    public static final int ITEM_LOCKED = 2;
    /** 物品：已换出 */
    public static final int ITEM_SWAPPED = 3;
    /** 物品：已下架 */
    public static final int ITEM_OFF = 4;
    public static final int ITEM_PENDING = 5;
    public static final int ITEM_REJECTED = 6;

    /** 报价：待响应 */
    public static final int OFFER_PENDING = 0;
    /** 报价：已接受 */
    public static final int OFFER_ACCEPTED = 1;
    /** 报价：已拒绝 */
    public static final int OFFER_REJECTED = 2;
    /** 报价：已失效（超时或被他单占用） */
    public static final int OFFER_EXPIRED = 3;
    /** 报价：已撤回 */
    public static final int OFFER_CANCELED = 4;
    /** 报价：已还价关闭 */
    public static final int OFFER_COUNTERED = 5;

    /** 交换单：待各方确认 */
    public static final int EX_WAIT_CONFIRM = 1;
    /** 交换单：待交付 */
    public static final int EX_WAIT_DELIVER = 2;
    /** 交换单：已完成 */
    public static final int EX_DONE = 3;
    /** 交换单：已失效（任一方拒绝） */
    public static final int EX_INVALID = 4;
    /** 交换单：已超时关闭 */
    public static final int EX_TIMEOUT = 5;

    /** 举报：待处理 */
    public static final int REPORT_PENDING = 0;
    /** 举报：已处理 */
    public static final int REPORT_DONE = 1;
    /** 举报：已驳回 */
    public static final int REPORT_REJECTED = 2;

    /** 信用分下限，低于它不允许发布 */
    public static final int CREDIT_MIN_TO_PUBLISH = 60;
    /** 信用分初始值 */
    public static final int CREDIT_INIT = 80;
    /** 信用分上限 */
    public static final int CREDIT_MAX = 100;

    /** 信用等级：优秀 ≥ 90 */
    public static final int CREDIT_LEVEL_EXCELLENT = 90;
    /** 信用等级：良好 ≥ 80 */
    public static final int CREDIT_LEVEL_GOOD = 80;
    /** 信用等级：一般 ≥ 70 */
    public static final int CREDIT_LEVEL_FAIR = 70;
    /** 信用等级：较低 ≥ 60（低于此值功能受限） */
    public static final int CREDIT_LEVEL_LOW = 60;

    /** 一人在架物品上限 */
    public static final int MAX_ON_SHELF = 20;
    /** 报价有效期（小时） */
    public static final int OFFER_EXPIRE_HOURS = 24;
    /** 三方确认有效期（小时） */
    public static final int CONFIRM_EXPIRE_HOURS = 24;
    /** 交付有效期（天） */
    public static final int DELIVER_EXPIRE_DAYS = 7;
    /** 环匹配最多返回组数 */
    public static final int MAX_CYCLES = 3;

    /** 统一错误码 */
    public static final int CODE_OK = 0;
    public static final int CODE_BAD_REQUEST = 400;
    public static final int CODE_UNAUTHORIZED = 401;
    public static final int CODE_FORBIDDEN = 403;
    public static final int CODE_NOT_FOUND = 404;
    public static final int CODE_SERVER_ERROR = 500;

    public static String itemStatusText(int s) {
        switch (s) {
            case ITEM_ON:
                return "在架";
            case ITEM_LOCKED:
                return "锁定";
            case ITEM_SWAPPED:
                return "已换出";
            case ITEM_OFF:
                return "已下架";
            case ITEM_PENDING:
                return "待审核";
            case ITEM_REJECTED:
                return "审核未通过";
            default:
                return "未知";
        }
    }

    public static String offerStatusText(int s) {
        switch (s) {
            case OFFER_PENDING:
                return "待响应";
            case OFFER_ACCEPTED:
                return "已接受";
            case OFFER_REJECTED:
                return "已拒绝";
            case OFFER_EXPIRED:
                return "已失效";
            case OFFER_CANCELED:
                return "已撤回";
            case OFFER_COUNTERED:
                return "已还价";
            default:
                return "未知";
        }
    }

    public static String exchangeStatusText(int s) {
        switch (s) {
            case EX_WAIT_CONFIRM:
                return "待确认";
            case EX_WAIT_DELIVER:
                return "待交付";
            case EX_DONE:
                return "已完成";
            case EX_INVALID:
                return "已失效";
            case EX_TIMEOUT:
                return "已超时关闭";
            default:
                return "未知";
        }
    }
}
