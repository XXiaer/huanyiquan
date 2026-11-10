CREATE TABLE IF NOT EXISTS auction (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 seller_id BIGINT NOT NULL,
 title VARCHAR(80) NOT NULL,
 description VARCHAR(500) NOT NULL DEFAULT '',
 start_price DECIMAL(12,2) NOT NULL,
 current_price DECIMAL(12,2) NOT NULL,
 high_bidder_id BIGINT NULL,
 ends_at DATETIME NOT NULL,
 status TINYINT NOT NULL DEFAULT 1 COMMENT '1 active, 2 cancelled',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY auction_status_end (status, ends_at), KEY auction_seller (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS auction_bid (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 auction_id BIGINT NOT NULL,
 bidder_id BIGINT NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY bid_auction (auction_id,id),
 CONSTRAINT fk_auction_bid FOREIGN KEY (auction_id) REFERENCES auction(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
