-- =============================================================
-- 重置业务数据（保留表结构、保留管理员、保留敏感词）
-- 用途：答辩演示前把数据清干净，重新跑一遍
-- 执行方式：mysql -uroot -p --default-character-set=utf8mb4 < reset.sql
-- 注意：这会删掉所有物品、交换单、评价、举报，不可恢复。
-- =============================================================

USE huanyiquan;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `biz_log`;
TRUNCATE TABLE `exchange_detail`;
TRUNCATE TABLE `exchange`;
TRUNCATE TABLE `offers`;
TRUNCATE TABLE `review`;
TRUNCATE TABLE `report`;
TRUNCATE TABLE `intent`;
TRUNCATE TABLE `item`;
DELETE FROM `user` WHERE role = 0;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '已清空业务数据，管理员与敏感词保留' AS result;
