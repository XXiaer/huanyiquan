CREATE TABLE IF NOT EXISTS login_email_challenge (
  user_id BIGINT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  salt CHAR(32) NOT NULL,
  digest CHAR(64) NOT NULL,
  sent_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0
);
