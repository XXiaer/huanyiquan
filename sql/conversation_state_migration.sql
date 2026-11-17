CREATE TABLE IF NOT EXISTS item_conversation_state (
 conversation_id BIGINT NOT NULL,
 user_id BIGINT NOT NULL,
 pinned TINYINT(1) NOT NULL DEFAULT 0,
 hidden TINYINT(1) NOT NULL DEFAULT 0,
 PRIMARY KEY (conversation_id,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
