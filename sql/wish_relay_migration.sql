CREATE TABLE IF NOT EXISTS wish_offer (
  wish_id BIGINT PRIMARY KEY,
  item_id BIGINT NOT NULL,
  KEY idx_wish_offer_item (item_id)
);
