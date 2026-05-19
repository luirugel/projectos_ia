-- Rollback migration 006
-- Restores the original budgets policy without category ownership check

DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;

CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id);
