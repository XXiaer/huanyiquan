CREATE TABLE IF NOT EXISTS wish_match_notice (
  wish_id BIGINT NOT NULL, item_id BIGINT NOT NULL,
  PRIMARY KEY (wish_id,item_id)
);
CREATE TABLE IF NOT EXISTS account_email (
  user_id BIGINT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS account_email_challenge (
  user_id BIGINT PRIMARY KEY, email VARCHAR(254) NOT NULL,
  salt CHAR(32) NOT NULL, digest CHAR(64) NOT NULL,
  sent_at DATETIME NOT NULL, attempts INT NOT NULL DEFAULT 0
);
