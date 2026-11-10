-- =============================================================
-- 「换一圈」校园以物换物平台 · 数据库脚本
-- MySQL 8.0 / utf8mb4
-- 执行方式：mysql -uroot -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS huanyiquan
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;

USE huanyiquan;

-- -------------------------------------------------------------
-- 1. user 用户与信用
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    student_no  VARCHAR(20)  NOT NULL COMMENT '学号，登录账号',
    nickname    VARCHAR(30)  NOT NULL COMMENT '昵称',
    password    VARCHAR(64)  NOT NULL COMMENT 'SHA-256(salt + 明文)',
    salt        VARCHAR(32)  NOT NULL COMMENT '盐',
    college     VARCHAR(50)  DEFAULT NULL COMMENT '院系',
    building    VARCHAR(50)  DEFAULT NULL COMMENT '宿舍楼，用于就近面交',
    credit      INT          NOT NULL DEFAULT 80 COMMENT '信用分，初始 80',
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '1 正常 / 0 封禁',
    role        TINYINT      NOT NULL DEFAULT 0 COMMENT '0 普通用户 / 1 管理员',
    fail_count  INT          NOT NULL DEFAULT 0 COMMENT '连续密码错误次数',
    lock_until  DATETIME     DEFAULT NULL COMMENT '锁定截止时间',
    last_login  DATETIME     DEFAULT NULL COMMENT '最后登录时间',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted     TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除：1 已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_no (student_no),
    KEY idx_building (building)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='用户与信用';

-- -------------------------------------------------------------
-- 2. item 物品
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `item`;
CREATE TABLE `item` (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    owner_id        BIGINT       NOT NULL COMMENT '发布人',
    title           VARCHAR(30)  NOT NULL COMMENT '名称',
    category        VARCHAR(20)  NOT NULL COMMENT '类别：教材/数码/运动/生活/衣物/其他',
    condition_level VARCHAR(10)  NOT NULL COMMENT '成色：全新/九成新/七成新/有使用痕迹',
    description     VARCHAR(300) DEFAULT NULL COMMENT '描述',
    images          VARCHAR(500) DEFAULT NULL COMMENT '图片相对路径，逗号分隔，只存路径',
    expect_desc     VARCHAR(100) DEFAULT NULL COMMENT '期望换物的文字描述',
    status          TINYINT      NOT NULL DEFAULT 1 COMMENT '1 在架 / 2 锁定 / 3 已换出 / 4 已下架',
    offer_count     INT          NOT NULL DEFAULT 0 COMMENT '被报价次数',
    view_count      INT          NOT NULL DEFAULT 0 COMMENT '浏览次数',
    create_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted         TINYINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_owner (owner_id),
    KEY idx_status_time (status, create_time),
    KEY idx_category (category)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='物品';

-- -------------------------------------------------------------
-- 3. intent 意向表（环匹配的原料）
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `intent`;
CREATE TABLE `intent` (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL COMMENT '物品主人',
    item_id       BIGINT      NOT NULL COMMENT '哪件物品的意向',
    want_category VARCHAR(20) DEFAULT NULL COMMENT '想换的类别',
    want_item_id  BIGINT      DEFAULT NULL COMMENT '想换的具体物品，可空',
    create_time   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_item (item_id),
    KEY idx_user (user_id),
    KEY idx_want_item (want_item_id),
    KEY idx_want_category (want_category)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='换物意向';

-- -------------------------------------------------------------
-- 4. offers 报价单
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `offers`;
CREATE TABLE `offers` (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    item_id     BIGINT      NOT NULL COMMENT '目标物品',
    my_item_id  BIGINT      NOT NULL COMMENT '我拿出去换的物品',
    from_user   BIGINT      NOT NULL COMMENT '报价方',
    to_user     BIGINT      NOT NULL COMMENT '被报价方',
    message     VARCHAR(50) DEFAULT NULL COMMENT '留言，≤50 字',
    status      TINYINT     NOT NULL DEFAULT 0 COMMENT '0 待响应 / 1 已接受 / 2 已拒绝 / 3 已失效 / 4 已撤回 / 5 已还价关闭',
    parent_id   BIGINT      DEFAULT NULL COMMENT '还价链的上一手报价',
    expire_time DATETIME    NOT NULL COMMENT '过期时间，创建 +24 小时',
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    handle_time DATETIME    DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_to_user (to_user, status),
    KEY idx_from_user (from_user, status),
    KEY idx_item (item_id),
    KEY idx_expire (status, expire_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='报价单';

-- -------------------------------------------------------------
-- 5. exchange 交换单主表
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `exchange`;
CREATE TABLE `exchange` (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    type        TINYINT      NOT NULL COMMENT '1 一对一 / 3 三方环',
    status      TINYINT      NOT NULL COMMENT '1 待确认 / 2 待交付 / 3 已完成 / 4 已失效 / 5 已超时关闭',
    place       VARCHAR(100) DEFAULT NULL COMMENT '面交点',
    deal_time   VARCHAR(50)  DEFAULT NULL COMMENT '约定时间段',
    offer_id    BIGINT       DEFAULT NULL COMMENT '来源报价（一对一单）',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finish_time DATETIME     DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_status (status, create_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='交换单';

-- -------------------------------------------------------------
-- 6. exchange_detail 交换单明细（一对一两条，三方单三条）
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `exchange_detail`;
CREATE TABLE `exchange_detail` (
    id           BIGINT   NOT NULL AUTO_INCREMENT,
    exchange_id  BIGINT   NOT NULL,
    user_id      BIGINT   NOT NULL,
    give_item_id BIGINT   NOT NULL COMMENT '此人换出的物品',
    get_item_id  BIGINT   NOT NULL COMMENT '此人换入的物品',
    confirmed    TINYINT  NOT NULL DEFAULT 0 COMMENT '是否已确认参与：1 是',
    delivered    TINYINT  NOT NULL DEFAULT 0 COMMENT '是否已确认收货：1 是',
    confirm_time DATETIME DEFAULT NULL,
    deliver_time DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_exchange (exchange_id),
    KEY idx_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='交换单明细';

-- -------------------------------------------------------------
-- 7. review 互评
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    exchange_id BIGINT       NOT NULL,
    from_user   BIGINT       NOT NULL,
    to_user     BIGINT       NOT NULL,
    score       TINYINT      NOT NULL COMMENT '1-5 星',
    content     VARCHAR(100) DEFAULT NULL,
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_once (exchange_id, from_user, to_user),
    KEY idx_to_user (to_user)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='互评';

-- -------------------------------------------------------------
-- 8. report 举报
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `report`;
CREATE TABLE `report` (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    target_type TINYINT      NOT NULL COMMENT '1 物品 / 2 用户',
    target_id   BIGINT       NOT NULL,
    reason      VARCHAR(200) NOT NULL,
    reporter_id BIGINT       NOT NULL COMMENT '举报人，不对外暴露',
    status      TINYINT      NOT NULL DEFAULT 0 COMMENT '0 待处理 / 1 已处理 / 2 已驳回',
    handle_note VARCHAR(200) DEFAULT NULL,
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    handle_time DATETIME     DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_status (status, create_time),
    KEY idx_target (target_type, target_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='举报记录';

-- -------------------------------------------------------------
-- 9. sensitive_word 敏感词库
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `sensitive_word`;
CREATE TABLE `sensitive_word` (
    id    BIGINT      NOT NULL AUTO_INCREMENT,
    word  VARCHAR(30) NOT NULL,
    level TINYINT     NOT NULL DEFAULT 1 COMMENT '1 拦截 / 2 提醒',
    PRIMARY KEY (id),
    UNIQUE KEY uk_word (word)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='敏感词';

-- -------------------------------------------------------------
-- 10. biz_log 状态变更日志（UC-07 要求可追溯，答辩查纠纷用）
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `biz_log`;
CREATE TABLE `biz_log` (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      DEFAULT NULL COMMENT '操作人，系统任务为 NULL',
    target_type VARCHAR(20) NOT NULL COMMENT 'ITEM / OFFER / EXCHANGE / USER / REPORT',
    target_id   BIGINT      NOT NULL,
    from_status INT         DEFAULT NULL,
    to_status   INT         DEFAULT NULL,
    remark      VARCHAR(200) DEFAULT NULL,
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_target (target_type, target_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='状态变更日志';

-- -------------------------------------------------------------
-- 敏感词初始数据
-- -------------------------------------------------------------
INSERT INTO `sensitive_word` (word, level) VALUES
('代写', 1), ('代考', 1), ('刷单', 1), ('套现', 1), ('枪支', 1),
('假证', 1), ('贷款', 1), ('香烟', 2), ('酒', 2), ('处方药', 1);
