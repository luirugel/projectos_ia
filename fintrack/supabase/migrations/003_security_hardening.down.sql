-- Rollback for 003_security_hardening.sql
-- WARNING: reverting restores the cross-tenant exposure (C1) and the
-- missing FK-ownership checks (H1). Only for emergency rollback.

ALTER VIEW account_balances RESET (security_invoker);
ALTER VIEW budget_progress  RESET (security_invoker);

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own contributions" ON goal_contributions;
CREATE POLICY "Users can manage own contributions"
  ON goal_contributions FOR ALL USING (auth.uid() = user_id);
