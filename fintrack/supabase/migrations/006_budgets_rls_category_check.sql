-- Migration 006: Add category-ownership WITH CHECK to budgets RLS
-- Prevents inserting budgets that reference another user's private category
-- Mirrors the pattern from migration 003 (transactions + goal_contributions)

DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;

CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM categories c
      WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );
