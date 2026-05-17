-- Rollback for 001_initial_schema.sql
-- Drops everything created by the initial migration, in dependency order.
-- Destructive: all application data is lost.

DROP VIEW IF EXISTS account_balances;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS goals_updated_at ON goals;

DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at();

DROP TABLE IF EXISTS goal_contributions CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- uuid-ossp left in place: other schemas may depend on it.
