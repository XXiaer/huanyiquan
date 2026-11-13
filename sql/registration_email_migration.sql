CREATE TABLE IF NOT EXISTS registration_email_challenge (
  student_no CHAR(10) PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  salt CHAR(32) NOT NULL,
  digest CHAR(64) NOT NULL,
  sent_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  KEY idx_registration_email_time (email,sent_at)
);
