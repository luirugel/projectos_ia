-- ============================================================
-- 002_integrity_fixes.sql
-- Fixes from the code audit:
--   C2  goal.current_amount must be derived atomically from
--       SUM(goal_contributions), not a client-side read-modify-write.
--   W1  budget "spent" was an N+1 (one query per budget). Replace
--       with a single set-based view.
--   W4  budget spend now matches transactions by category NAME
--       (case-insensitive), mirroring the dashboard's name-merge so
--       system + user categories with the same name stay consistent.
-- ============================================================

-- ------------------------------------------------------------
-- C2: recompute goals.current_amount + status from contributions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION recompute_goal_amount()
RETURNS TRIGGER AS $$
DECLARE
  affected_goal UUID;
  total NUMERIC(12,2);
BEGIN
  affected_goal := COALESCE(NEW.goal_id, OLD.goal_id);

  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM goal_contributions
  WHERE goal_id = affected_goal;

  UPDATE goals
  SET
    current_amount = total,
    status = CASE
      WHEN total >= target_amount THEN 'completed'
      -- regressed below target (e.g. a contribution was deleted)
      WHEN status = 'completed' THEN 'active'
      ELSE status
    END
  WHERE id = affected_goal;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS goal_contributions_recompute ON goal_contributions;
CREATE TRIGGER goal_contributions_recompute
  AFTER INSERT OR UPDATE OR DELETE ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION recompute_goal_amount();

-- One-time backfill so existing goals are consistent with their history.
UPDATE goals g
SET current_amount = COALESCE(c.total, 0),
    status = CASE
      WHEN COALESCE(c.total, 0) >= g.target_amount THEN 'completed'
      WHEN g.status = 'completed' THEN 'active'
      ELSE g.status
    END
FROM (
  SELECT goal_id, SUM(amount) AS total
  FROM goal_contributions
  GROUP BY goal_id
) c
WHERE c.goal_id = g.id;

-- ------------------------------------------------------------
-- W1 + W4: single-query budget progress for the current period
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW budget_progress AS
SELECT
  b.id,
  b.user_id,
  b.category_id,
  b.amount_limit,
  b.period,
  b.alert_at_50,
  b.alert_at_80,
  b.alert_at_100,
  b.rollover,
  b.is_active,
  b.created_at,
  COALESCE(s.spent, 0) AS spent
FROM budgets b
LEFT JOIN categories bc ON bc.id = b.category_id
LEFT JOIN LATERAL (
  SELECT SUM(t.amount) AS spent
  FROM transactions t
  JOIN categories tc ON tc.id = t.category_id
  WHERE t.user_id = b.user_id
    AND t.type = 'expense'
    AND lower(btrim(tc.name)) = lower(btrim(bc.name))
    AND t.date >= CASE b.period
        WHEN 'weekly' THEN date_trunc('week',  now())::date
        WHEN 'yearly' THEN date_trunc('year',  now())::date
        ELSE                date_trunc('month', now())::date
      END
    AND t.date <= CASE b.period
        WHEN 'weekly' THEN (date_trunc('week',  now()) + interval '6 days')::date
        WHEN 'yearly' THEN (date_trunc('year',  now()) + interval '1 year'  - interval '1 day')::date
        ELSE                (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date
      END
) s ON true
WHERE b.is_active = true;
