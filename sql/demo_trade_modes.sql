-- Mode 4 is reserved for examples that demonstrate both trade methods.
CREATE TEMPORARY TABLE demo_mode_assignment AS
SELECT id, CASE MOD(ROW_NUMBER() OVER (ORDER BY id) - 1, 3)
  WHEN 0 THEN 2 WHEN 1 THEN 1 ELSE 4 END AS demo_mode
FROM item
WHERE is_demo = 1 AND deleted = 0 AND status = 1;

START TRANSACTION;
UPDATE item AS i
JOIN demo_mode_assignment AS a ON a.id = i.id
SET i.trade_mode = a.demo_mode,
    i.want_text = CASE WHEN a.demo_mode IN (2, 4)
      THEN COALESCE(NULLIF(i.want_text, ''), '同类校园好物')
      ELSE i.want_text END,
    i.update_time = i.update_time
WHERE i.is_demo = 1 AND i.deleted = 0 AND i.status = 1;
COMMIT;
DROP TEMPORARY TABLE demo_mode_assignment;

