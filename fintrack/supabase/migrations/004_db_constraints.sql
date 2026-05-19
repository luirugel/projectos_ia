-- ============================================================
-- 004_db_constraints.sql
--   Enforce at the DB layer the same bounds that Zod validates
--   at the application layer. Direct Supabase REST/SDK calls
--   with the anon key bypass client-side validation entirely;
--   these constraints are the only enforcement that survives.
-- ============================================================

-- transactions: mirror Zod schema bounds
ALTER TABLE transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_description_length
    CHECK (description IS NULL OR char_length(description) <= 100),
  ADD CONSTRAINT IF NOT EXISTS transactions_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 500),
  ADD CONSTRAINT IF NOT EXISTS transactions_tags_limit
    CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10),
  ADD CONSTRAINT IF NOT EXISTS transactions_tag_element_length
    CHECK (tags IS NULL OR (SELECT bool_and(char_length(t) <= 50) FROM unnest(tags) AS t));

-- accounts: name length
ALTER TABLE accounts
  ADD CONSTRAINT IF NOT EXISTS accounts_name_length
    CHECK (char_length(name) <= 60);

-- profiles: allowed currency codes only
ALTER TABLE profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_currency_allowed
    CHECK (currency IN ('USD', 'EUR', 'MXN', 'COP', 'PEN', 'ARS', 'CLP'));

-- goals: name length
ALTER TABLE goals
  ADD CONSTRAINT IF NOT EXISTS goals_name_length
    CHECK (char_length(name) <= 100);

-- budgets: no additional constraints needed (numeric CHECK already in schema)

-- goal_contributions: note length
ALTER TABLE goal_contributions
  ADD CONSTRAINT IF NOT EXISTS contributions_note_length
    CHECK (note IS NULL OR char_length(note) <= 200);

-- Prevent any role from calling the SECURITY DEFINER trigger function directly.
-- It is invoked only by the goal_contributions_recompute trigger.
REVOKE ALL ON FUNCTION recompute_goal_amount() FROM PUBLIC;
