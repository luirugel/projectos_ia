-- ============================================================
-- 005_security_definer_search_path.sql
--   SECURITY DEFINER functions without a fixed search_path are
--   vulnerable to schema-shadowing attacks in PostgreSQL. A fixed
--   search_path ensures the function always resolves objects in
--   the expected schemas regardless of the caller's search_path.
-- ============================================================

CREATE OR REPLACE FUNCTION recompute_goal_amount()
RETURNS TRIGGER AS $$
DECLARE
  affected_goal UUID;
  new_amount    NUMERIC(12,2);
BEGIN
  affected_goal := COALESCE(NEW.goal_id, OLD.goal_id);

  SELECT COALESCE(SUM(amount), 0)
    INTO new_amount
    FROM goal_contributions
   WHERE goal_id = affected_goal;

  UPDATE goals
     SET current_amount = new_amount,
         status = CASE
           WHEN new_amount >= target_amount THEN 'completed'
           WHEN status = 'completed' THEN 'active'
           ELSE status
         END
   WHERE id = affected_goal;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = pg_catalog, public;
