-- Rollback for 002_integrity_fixes.sql
-- Note: the one-time goals backfill is not reversible (prior current_amount
-- values are not retained); only the schema objects are dropped.

DROP VIEW IF EXISTS budget_progress;

DROP TRIGGER IF EXISTS goal_contributions_recompute ON goal_contributions;
DROP FUNCTION IF EXISTS recompute_goal_amount();
