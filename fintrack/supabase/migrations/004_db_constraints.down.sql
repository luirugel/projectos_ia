-- Rollback 004_db_constraints.sql
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_description_length,
  DROP CONSTRAINT IF EXISTS transactions_notes_length,
  DROP CONSTRAINT IF EXISTS transactions_tags_limit;

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_name_length;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_currency_allowed;

ALTER TABLE goals
  DROP CONSTRAINT IF EXISTS goals_name_length;

ALTER TABLE goal_contributions
  DROP CONSTRAINT IF EXISTS contributions_note_length;
