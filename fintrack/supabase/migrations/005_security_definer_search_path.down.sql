-- Rollback 005: remove SET search_path from the function (reverts to 002 state)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
