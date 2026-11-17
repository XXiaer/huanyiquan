-- v3.0: cash proposals, chat association and cancellation attribution.
DROP PROCEDURE IF EXISTS hyq_migrate_offline_sale;
DELIMITER //
CREATE PROCEDURE hyq_migrate_offline_sale()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='auction' AND COLUMN_NAME='request_key') THEN
        ALTER TABLE auction ADD COLUMN request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
            ADD UNIQUE KEY idx_auction_publish_request (seller_id,request_key);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='offers' AND COLUMN_NAME='amount_cents') THEN
        ALTER TABLE offers ADD COLUMN amount_cents BIGINT DEFAULT NULL COMMENT '面交成交报价（分）；空值为以物换物';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='offers' AND COLUMN_NAME='conversation_id') THEN
        ALTER TABLE offers ADD COLUMN conversation_id BIGINT DEFAULT NULL, ADD KEY idx_offer_conversation (conversation_id,id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='offers' AND COLUMN_NAME='my_item_id' AND IS_NULLABLE='NO') THEN
        ALTER TABLE offers MODIFY COLUMN my_item_id BIGINT DEFAULT NULL COMMENT '我拿出去换的物品；面交现金提案为空';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='exchange_detail' AND COLUMN_NAME='give_item_id' AND IS_NULLABLE='NO') THEN
        ALTER TABLE exchange_detail MODIFY COLUMN give_item_id BIGINT DEFAULT NULL, MODIFY COLUMN get_item_id BIGINT DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='exchange' AND COLUMN_NAME='closed_by') THEN
        ALTER TABLE `exchange` ADD COLUMN closed_by BIGINT DEFAULT NULL COMMENT '主动取消交换的参与者 ID';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='exchange' AND INDEX_NAME='idx_exchange_offer') THEN
        ALTER TABLE `exchange` ADD KEY idx_exchange_offer (offer_id);
    END IF;
    UPDATE offers o
    JOIN offers root ON root.id=COALESCE(o.root_offer_id,o.id)
    JOIN item_conversation c ON c.item_id=root.item_id AND c.buyer_id=root.from_user AND c.seller_id=root.to_user
    SET o.conversation_id=c.id
    WHERE o.conversation_id IS NULL;
END //
DELIMITER ;
CALL hyq_migrate_offline_sale();
DROP PROCEDURE IF EXISTS hyq_migrate_offline_sale;
