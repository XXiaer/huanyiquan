-- 增量迁移：双方确认面交安排（版本化）+ 提案链历史与物品快照
-- 安全幂等设计：可重复执行，不会破坏已有业务数据

CREATE TABLE IF NOT EXISTS `exchange_arrangement` (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    exchange_id BIGINT       NOT NULL COMMENT '关联交换单 ID',
    version     INT          NOT NULL COMMENT '同一交换单内递增值',
    proposer_id BIGINT       NOT NULL COMMENT '提议/改期人 ID',
    place       VARCHAR(120) NOT NULL COMMENT '面交地点',
    start_time  VARCHAR(40)  DEFAULT NULL COMMENT '约定日期与开始时间',
    end_time    VARCHAR(40)  DEFAULT NULL COMMENT '结束时间或时间段文本',
    note        VARCHAR(200) DEFAULT NULL COMMENT '选填备注',
    status      TINYINT      NOT NULL DEFAULT 0 COMMENT '0 待确认 / 1 已生效 / 2 已被新版本替代 / 3 已作废',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ex_ver (exchange_id, version),
    KEY idx_ex_status (exchange_id, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '交换单面交安排版本表';

CREATE TABLE IF NOT EXISTS `exchange_arrangement_confirmation` (
    id             BIGINT   NOT NULL AUTO_INCREMENT,
    arrangement_id BIGINT   NOT NULL COMMENT '面交安排版本 ID',
    user_id        BIGINT   NOT NULL COMMENT '确认人 ID',
    confirmed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_arr_user (arrangement_id, user_id),
    KEY idx_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '面交安排确认记录';

DROP PROCEDURE IF EXISTS hyq_migrate_arr_prop;
DELIMITER //
CREATE PROCEDURE hyq_migrate_arr_prop()
BEGIN
    DECLARE changed_rows INT DEFAULT 1;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exchange' AND COLUMN_NAME = 'confirmed_arrangement_id') THEN
        ALTER TABLE `exchange` ADD COLUMN confirmed_arrangement_id BIGINT DEFAULT NULL COMMENT '当前已双方/三方确认生效的安排 ID';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exchange' AND COLUMN_NAME = 'pending_arrangement_id') THEN
        ALTER TABLE `exchange` ADD COLUMN pending_arrangement_id BIGINT DEFAULT NULL COMMENT '当前待确认的面交提议 ID';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'root_offer_id') THEN
        ALTER TABLE `offers` ADD COLUMN root_offer_id BIGINT DEFAULT NULL COMMENT '提案链根报价 ID';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'target_title_snap') THEN
        ALTER TABLE `offers` ADD COLUMN target_title_snap VARCHAR(100) DEFAULT NULL COMMENT '目标物品标题快照';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'target_thumb_snap') THEN
        ALTER TABLE `offers` ADD COLUMN target_thumb_snap VARCHAR(255) DEFAULT NULL COMMENT '目标物品缩略图快照';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'target_cond_snap') THEN
        ALTER TABLE `offers` ADD COLUMN target_cond_snap VARCHAR(30) DEFAULT NULL COMMENT '目标物品成色快照';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'my_title_snap') THEN
        ALTER TABLE `offers` ADD COLUMN my_title_snap VARCHAR(100) DEFAULT NULL COMMENT '发起方物品标题快照';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'my_thumb_snap') THEN
        ALTER TABLE `offers` ADD COLUMN my_thumb_snap VARCHAR(255) DEFAULT NULL COMMENT '发起方物品缩略图快照';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers' AND COLUMN_NAME = 'my_cond_snap') THEN
        ALTER TABLE `offers` ADD COLUMN my_cond_snap VARCHAR(30) DEFAULT NULL COMMENT '发起方物品成色快照';
    END IF;
    UPDATE offers SET root_offer_id = id WHERE parent_id IS NULL;
    WHILE changed_rows > 0 DO
        UPDATE offers child
        JOIN offers parent ON child.parent_id = parent.id
        SET child.root_offer_id = parent.root_offer_id
        WHERE parent.root_offer_id IS NOT NULL
          AND NOT (child.root_offer_id <=> parent.root_offer_id);
        SET changed_rows = ROW_COUNT();
    END WHILE;
END //
DELIMITER ;
CALL hyq_migrate_arr_prop();
DROP PROCEDURE IF EXISTS hyq_migrate_arr_prop;
