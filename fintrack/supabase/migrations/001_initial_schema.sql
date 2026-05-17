-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  currency     TEXT NOT NULL DEFAULT 'USD',
  timezone     TEXT NOT NULL DEFAULT 'America/Guayaquil',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: accounts (wallets)
-- ============================================
CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'savings', 'investment')),
  initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  color           TEXT DEFAULT '#6366f1',
  icon            TEXT DEFAULT 'wallet',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
  icon        TEXT NOT NULL DEFAULT 'tag',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: transactions
-- ============================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description     TEXT,
  notes           TEXT,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  receipt_url     TEXT,
  tags            TEXT[],
  to_account_id   UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: budgets
-- ============================================
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount_limit    NUMERIC(12,2) NOT NULL CHECK (amount_limit > 0),
  period          TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  alert_at_50     BOOLEAN NOT NULL DEFAULT true,
  alert_at_80     BOOLEAN NOT NULL DEFAULT true,
  alert_at_100    BOOLEAN NOT NULL DEFAULT true,
  rollover        BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: goals (savings goals)
-- ============================================
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  target_amount   NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date     DATE,
  icon            TEXT DEFAULT 'target',
  color           TEXT DEFAULT '#10b981',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TABLE: goal_contributions
-- ============================================
CREATE TABLE goal_contributions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note        TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX idx_transactions_date       ON transactions(date DESC);
CREATE INDEX idx_transactions_category   ON transactions(category_id);
CREATE INDEX idx_transactions_account    ON transactions(account_id);
CREATE INDEX idx_budgets_user_id         ON budgets(user_id);
CREATE INDEX idx_goals_user_id           ON goals(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions   ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- accounts
CREATE POLICY "Users can manage own accounts"
  ON accounts FOR ALL USING (auth.uid() = user_id);

-- categories: own + system defaults
CREATE POLICY "Users can view own and system categories"
  ON categories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage own categories"
  ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

-- budgets
CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- goals
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL USING (auth.uid() = user_id);

-- goal_contributions
CREATE POLICY "Users can manage own contributions"
  ON goal_contributions FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: update updated_at automatically
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEW: account_balances
-- ============================================
CREATE VIEW account_balances AS
SELECT
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.color,
  a.icon,
  a.initial_balance + COALESCE(SUM(
    CASE
      WHEN t.type = 'income' THEN t.amount
      WHEN t.type = 'expense' THEN -t.amount
      WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
      WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN t.amount
      ELSE 0
    END
  ), 0) AS current_balance
FROM accounts a
LEFT JOIN transactions t ON (t.account_id = a.id OR t.to_account_id = a.id)
WHERE a.is_active = true
GROUP BY a.id;
