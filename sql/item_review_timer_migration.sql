ALTER TABLE item ADD COLUMN review_submitted_at DATETIME NULL;
UPDATE item SET review_submitted_at=update_time WHERE status=5 AND review_submitted_at IS NULL;
CREATE INDEX item_review_queue ON item(status,review_submitted_at);
