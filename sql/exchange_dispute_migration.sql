CREATE TABLE IF NOT EXISTS exchange_dispute (
    exchange_id BIGINT NOT NULL PRIMARY KEY,
    opened_by BIGINT NOT NULL,
    previous_status INT NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_by BIGINT DEFAULT NULL,
    resolution VARCHAR(1000) DEFAULT NULL,
    resolved_at DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exchange_dispute_statement (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    exchange_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    body VARCHAR(1000) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_dispute_statement (exchange_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
