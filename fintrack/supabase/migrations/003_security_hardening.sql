-- ============================================================
-- 003_security_hardening.sql  (security review remediation)
--   C1  CRITICAL: account_balances / budget_progress are plain
--       views — they run with the owner's rights and bypass the
--       caller's RLS, so the public anon key can read EVERY user's
--       balances via PostgREST. Force security_invoker so the
--       querying user's RLS applies.  (Requires PostgreSQL 15+;
--       all current Supabase projects qualify.)
--   H1  HIGH: the goal_contributions / transactions RLS policies
--       only checked the row's own user_id, not the ownership of
--       referenced foreign keys — allowing cross-tenant writes
--       (amplified by the SECURITY DEFINER goal trigger). Add
--       WITH CHECK clauses that validate FK ownership.
-- ============================================================

-- ---- C1 -----------------------------------------------------
ALTER VIEW account_balances SET (security_invoker = on);
ALTER VIEW budget_progress  SET (security_invoker = on);

-- ---- H1: transactions --------------------------------------
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = account_id AND a.user_id = auth.uid()
    )
    AND (
      to_account_id IS NULL OR EXISTS (
        SELECT 1 FROM accounts a
        WHERE a.id = to_account_id AND a.user_id = auth.uid()
      )
    )
    AND (
      category_id IS NULL OR EXISTS (
        SELECT 1 FROM categories c
        WHERE c.id = category_id
          AND (c.user_id = auth.uid() OR c.user_id IS NULL)
      )
    )
  );

-- ---- H1: goal_contributions --------------------------------
DROP POLICY IF EXISTS "Users can manage own contributions" ON goal_contributions;
CREATE POLICY "Users can manage own contributions"
  ON goal_contributions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM goals g
      WHERE g.id = goal_id AND g.user_id = auth.uid()
    )
  );
