# CLAUDE.md — FinTrack: Personal Finance App

## Project Overview

**App Name:** FinTrack (or customize the name)
**Type:** Multi-user personal finance web app (SaaS)
**Goal:** Allow users to register daily expenses and income, manage budgets per category, track savings goals, and visualize financial data — synchronized across devices.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 3+ |
| UI Components | shadcn/ui | latest |
| Backend / DB | Supabase | latest |
| Auth | Supabase Auth | built-in |
| Charts | Recharts | 2+ |
| Forms | React Hook Form + Zod | latest |
| State | Zustand | 4+ |
| PWA | next-pwa | latest |
| Icons | Lucide React | latest |
| Date Utils | date-fns | 3+ |
| Hosting | Vercel | — |

---

## Project Structure

```
fintrack/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar + navbar layout
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── transactions/
│   │   │   ├── page.tsx                # Transaction list with filters
│   │   │   └── [id]/page.tsx           # Transaction detail/edit
│   │   ├── accounts/
│   │   │   └── page.tsx                # Wallet/account management
│   │   ├── budgets/
│   │   │   └── page.tsx                # Budget management
│   │   ├── goals/
│   │   │   └── page.tsx                # Savings goals
│   │   ├── reports/
│   │   │   └── page.tsx                # Charts and analytics
│   │   └── settings/
│   │       └── page.tsx                # User profile and preferences
│   ├── api/
│   │   └── export/
│   │       └── route.ts                # Excel/CSV export endpoint
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn/ui base components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── MobileNav.tsx
│   ├── dashboard/
│   │   ├── SummaryCards.tsx            # Income / Expense / Balance cards
│   │   ├── RecentTransactions.tsx
│   │   ├── BudgetProgressList.tsx
│   │   └── GoalProgressList.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx         # New/edit transaction modal
│   │   ├── TransactionList.tsx
│   │   ├── TransactionFilters.tsx
│   │   └── TransactionCard.tsx
│   ├── budgets/
│   │   ├── BudgetForm.tsx
│   │   └── BudgetCard.tsx
│   ├── goals/
│   │   ├── GoalForm.tsx
│   │   ├── GoalCard.tsx
│   │   └── GoalContributionForm.tsx
│   ├── accounts/
│   │   ├── AccountForm.tsx
│   │   └── AccountCard.tsx
│   ├── reports/
│   │   ├── CategoryPieChart.tsx
│   │   ├── MonthlyBarChart.tsx
│   │   └── TrendLineChart.tsx
│   └── shared/
│       ├── CategoryIcon.tsx
│       ├── AmountDisplay.tsx
│       ├── DateRangePicker.tsx
│       └── ConfirmDialog.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server-side Supabase client
│   │   └── middleware.ts               # Auth middleware
│   ├── validations/
│   │   ├── transaction.ts              # Zod schemas
│   │   ├── budget.ts
│   │   ├── goal.ts
│   │   └── account.ts
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   ├── useBudgets.ts
│   │   ├── useGoals.ts
│   │   ├── useAccounts.ts
│   │   └── useDashboardSummary.ts
│   ├── stores/
│   │   └── uiStore.ts                  # Zustand UI state (modals, sidebar)
│   └── utils/
│       ├── currency.ts                 # Format USD amounts
│       ├── dates.ts                    # Date formatting helpers
│       └── export.ts                   # Excel/CSV generation
├── types/
│   └── database.ts                     # TypeScript types matching DB schema
├── public/
│   ├── icons/                          # PWA icons
│   └── manifest.json
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # Full DB schema (see below)
│   └── seed.sql                        # Default categories seed data
├── middleware.ts                        # Next.js auth middleware
├── next.config.ts
├── tailwind.config.ts
└── CLAUDE.md                           # This file
```

---

## Database Schema (Supabase / PostgreSQL)

### Instructions for Claude Code
Run all SQL in `supabase/migrations/001_initial_schema.sql`. Enable Row Level Security (RLS) on every table.

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Extends Supabase auth.users
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
  -- NULL user_id = system default category (visible to all)
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
  recurrence_rule TEXT,        -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  receipt_url     TEXT,        -- Supabase Storage URL
  tags            TEXT[],      -- Array of tags
  -- For transfers only
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
ALTER TABLE budgets               ENABLE ROW LEVEL SECURITY;
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
```

---

## Seed Data (supabase/seed.sql)

```sql
-- Default system categories (user_id = NULL = visible to all users)

INSERT INTO categories (user_id, name, type, icon, color) VALUES
-- Expense categories
(NULL, 'Alimentación',      'expense', 'utensils',       '#f59e0b'),
(NULL, 'Transporte',        'expense', 'car',             '#3b82f6'),
(NULL, 'Vivienda',          'expense', 'home',            '#8b5cf6'),
(NULL, 'Salud',             'expense', 'heart-pulse',     '#ef4444'),
(NULL, 'Educación',         'expense', 'graduation-cap',  '#06b6d4'),
(NULL, 'Entretenimiento',   'expense', 'film',            '#ec4899'),
(NULL, 'Ropa',              'expense', 'shirt',           '#f97316'),
(NULL, 'Tecnología',        'expense', 'laptop',          '#6366f1'),
(NULL, 'Servicios básicos', 'expense', 'zap',             '#84cc16'),
(NULL, 'Deudas',            'expense', 'credit-card',     '#dc2626'),
(NULL, 'Mascotas',          'expense', 'paw-print',       '#d97706'),
(NULL, 'Viajes',            'expense', 'plane',           '#0891b2'),
(NULL, 'Gimnasio',          'expense', 'dumbbell',        '#16a34a'),
(NULL, 'Otros gastos',      'expense', 'more-horizontal', '#9ca3af'),
-- Income categories
(NULL, 'Salario',           'income',  'briefcase',       '#10b981'),
(NULL, 'Freelance',         'income',  'code',            '#059669'),
(NULL, 'Inversiones',       'income',  'trending-up',     '#047857'),
(NULL, 'Alquiler',          'income',  'building',        '#065f46'),
(NULL, 'Regalo',            'income',  'gift',            '#d1fae5'),
(NULL, 'Otros ingresos',    'income',  'plus-circle',     '#6ee7b7');
```

---

## Environment Variables (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Only in server-side code
```

---

## TypeScript Types (types/database.ts)

```typescript
export type TransactionType = 'expense' | 'income' | 'transfer'
export type AccountType = 'cash' | 'bank' | 'credit_card' | 'savings' | 'investment'
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'
export type GoalStatus = 'active' | 'completed' | 'paused'
export type CategoryType = 'expense' | 'income' | 'both'
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Profile {
  id: string
  full_name: string | null
  currency: string
  timezone: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  initial_balance: number
  color: string
  icon: string
  is_active: boolean
  created_at: string
  // Computed
  current_balance?: number
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: CategoryType
  icon: string
  color: string
  is_active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string | null
  notes: string | null
  date: string
  is_recurring: boolean
  recurrence_rule: RecurrenceRule | null
  receipt_url: string | null
  tags: string[]
  to_account_id: string | null
  created_at: string
  updated_at: string
  // Joined
  account?: Account
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount_limit: number
  period: BudgetPeriod
  alert_at_50: boolean
  alert_at_80: boolean
  alert_at_100: boolean
  rollover: boolean
  is_active: boolean
  created_at: string
  // Joined
  category?: Category
  // Computed
  spent?: number
  percentage?: number
}

export interface Goal {
  id: string
  user_id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  icon: string
  color: string
  status: GoalStatus
  created_at: string
  updated_at: string
  // Computed
  percentage?: number
  days_remaining?: number
}

export interface GoalContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  note: string | null
  date: string
  created_at: string
}

// Dashboard summary type
export interface DashboardSummary {
  period: { start: string; end: string }
  total_income: number
  total_expenses: number
  net_balance: number
  by_category: Array<{
    category: Category
    total: number
    percentage: number
    transaction_count: number
  }>
  accounts_balance: Array<{
    account: Account
    balance: number
  }>
}
```

---

## Business Logic Rules

### Account Balance Calculation
```
current_balance = initial_balance
  + SUM(transactions WHERE type='income' AND account_id=X)
  - SUM(transactions WHERE type='expense' AND account_id=X)
  - SUM(transactions WHERE type='transfer' AND account_id=X)
  + SUM(transactions WHERE type='transfer' AND to_account_id=X)
```

### Budget Progress Calculation
```
spent = SUM(transactions.amount 
  WHERE category_id = budget.category_id 
  AND type = 'expense'
  AND date WITHIN current period)

percentage = (spent / amount_limit) * 100
```

### Goal Completion Logic
```
current_amount = SUM(goal_contributions.amount WHERE goal_id = X)
percentage = (current_amount / target_amount) * 100
IF percentage >= 100 THEN status = 'completed'
```

### Dashboard Period
- Default: current calendar month (from day 1 to today)
- Filterable by: this week / this month / last month / custom range

---

## UI/UX Requirements

### Design System
- **Color palette:** Dark theme primary. Deep navy background (`#0f172a`), card surfaces (`#1e293b`), accent green for income (`#10b981`), accent red for expenses (`#ef4444`), accent blue for neutral actions (`#3b82f6`)
- **Typography:** Display font for numbers/headings, clean sans-serif for body
- **Mobile-first:** All layouts must work on 375px width and up
- **Sidebar:** Collapsible on mobile (hamburger → drawer), fixed on desktop

### Transaction Entry (Critical UX)
- Must be completable in **under 15 seconds**
- Large numeric keypad on mobile
- Category selector with icon grid (not dropdown)
- Date defaults to today
- Quick-save with keyboard shortcut `Ctrl+Enter`
- Recent categories shown first

### Dashboard Cards
1. **Net Balance** — large number, green/red depending on sign
2. **This Month Income** — green
3. **This Month Expenses** — red
4. **Savings Rate** — percentage badge
5. **Budget Alerts** — show only budgets above 80%

### Charts (Recharts)
- **Pie chart:** Expenses by category — current month
- **Bar chart:** Income vs Expenses — last 6 months
- **Line chart:** Daily spending trend — current month
- All charts must be responsive and have tooltips

---

## Development Phases — Build Order

Claude Code should build in this exact order to avoid dependency issues:

### Phase 1 — Foundation
1. `next.config.ts` — setup Next.js + PWA
2. `tailwind.config.ts` — design tokens
3. `lib/supabase/client.ts` and `server.ts`
4. `middleware.ts` — auth protection
5. `types/database.ts`

### Phase 2 — Auth
6. Login page with email + Google OAuth
7. Register page
8. Forgot password page
9. Auth callback handler

### Phase 3 — Core Data Hooks
10. `hooks/useAccounts.ts`
11. `hooks/useTransactions.ts`
12. `hooks/useBudgets.ts`
13. `hooks/useGoals.ts`
14. `hooks/useDashboardSummary.ts`

### Phase 4 — Layout
15. Dashboard layout with sidebar
16. Mobile navigation

### Phase 5 — Screens (in order)
17. Dashboard home — summary cards + recent transactions
18. Transactions list — filters + pagination
19. TransactionForm modal — new/edit
20. Accounts page
21. Budgets page
22. Goals page
23. Reports page — all charts
24. Settings page

### Phase 6 — Polish
25. Export to CSV/Excel
26. PWA manifest + service worker
27. Loading skeletons
28. Empty states
29. Error boundaries

---

## Validation Rules (Zod)

### Transaction
```typescript
const transactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.number().positive().max(999999999),
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  description: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string()).max(10).optional(),
  to_account_id: z.string().uuid().optional(),
  is_recurring: z.boolean(),
  recurrence_rule: z.enum(['daily','weekly','monthly','yearly']).optional()
})
```

### Budget
```typescript
const budgetSchema = z.object({
  category_id: z.string().uuid(),
  amount_limit: z.number().positive().max(999999999),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  alert_at_50: z.boolean(),
  alert_at_80: z.boolean(),
  alert_at_100: z.boolean(),
  rollover: z.boolean()
})
```

### Goal
```typescript
const goalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  target_amount: z.number().positive().max(999999999),
  current_amount: z.number().min(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  icon: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
})
```

---

## Key Supabase Queries to Implement

### Dashboard Summary
```typescript
// Monthly income
const { data: income } = await supabase
  .from('transactions')
  .select('amount')
  .eq('user_id', userId)
  .eq('type', 'income')
  .gte('date', startOfMonth)
  .lte('date', endOfMonth)

// Monthly expenses by category (with join)
const { data: byCategory } = await supabase
  .from('transactions')
  .select(`
    amount,
    categories (id, name, icon, color)
  `)
  .eq('user_id', userId)
  .eq('type', 'expense')
  .gte('date', startOfMonth)
  .lte('date', endOfMonth)
```

### Account Balance (using database view — create this view)
```sql
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
```

---

## Notes for Claude Code

- **Always use TypeScript** — no implicit `any`
- **Always handle loading and error states** in every component
- **All Supabase queries must have RLS** — never query without user context
- **Use Server Components** for data fetching where possible (Next.js App Router)
- **Use Client Components** only when interactivity is needed (forms, charts, modals)
- **Currency formatting:** always use `Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })`
- **Date formatting:** always use `date-fns` with `es` locale and `America/Guayaquil` timezone
- **Mobile breakpoint:** `md:` = tablet+, `lg:` = desktop. Design for mobile first
- **Sidebar state** must be persisted in Zustand and localStorage
- **Forms** must use React Hook Form + Zod — no uncontrolled inputs
- **Do not use any** in TypeScript — use proper types from `types/database.ts`
- **All monetary values** stored as `NUMERIC(12,2)` in DB, displayed formatted in UI

---

## Initial Prompt to Give Claude Code

Paste this at the start of your Claude Code session:

```
I'm building a multi-user personal finance web app called FinTrack.

Read CLAUDE.md in the root of this project — it contains the complete specification including tech stack, database schema, file structure, TypeScript types, business logic, validation rules, and build order.

Start with Phase 1 (Foundation) as described in the "Development Phases" section:
1. Initialize Next.js 14 with TypeScript and App Router
2. Install and configure Tailwind CSS + shadcn/ui
3. Set up Supabase client (browser + server)
4. Configure auth middleware
5. Create types/database.ts with all TypeScript interfaces

After Phase 1 is complete, confirm and I will tell you to proceed to Phase 2 (Auth).

Use dark theme as default. Primary colors: background #0f172a, cards #1e293b, income accent #10b981, expense accent #ef4444.
```

---

## Design Context

Strategic design direction lives in **`fintrack/PRODUCT.md`** (created via the `impeccable` skill's `teach` flow). Read it before any UI work.

- **Register:** `product` (app UI; design serves the workflow).
- **Strategic spine:** borrow Duolingo's *habit engine* (streaks, momentum, the daily pull to return) but execute it **grown-up** — no mascots, no confetti spam, no patronizing badges, because it's real money.
- **Audience:** global, Spanish-first SaaS; mobile-heavy; short frequent sessions.
- **Anti-reference:** childish gamification (explicitly forbidden).
- **Accessibility:** WCAG AA, reduced-motion honored, full keyboard operability. Open question flagged in `PRODUCT.md`: the red/green income/expense pairing needs a non-color cue.

> Note: `PRODUCT.md` records that the implemented default theme is the **warm-cream light** theme (`#f6f3ee`) with navy dark as the alternate — this differs from the "dark theme as default" line in the initial prompt above. The implementation is the source of truth; treat the prompt line as historical.

A visual system spec (`fintrack/DESIGN.md`) is generated separately via `impeccable document`.
Active agents
Uncomment the agents relevant to this project:
- FullStack Dev   → agents/prompts/fullstack.md
- Code Auditor    → agents/prompts/auditor.md   (via /project:audit)
- Security        → agents/prompts/security.md  (via /project:security or pre-commit)
- UX/UI Design    → agents/prompts/ux-ui.md     (via /project:ux-spec)
- DevOps          → agents/prompts/devops.md    (via /project:devops-check)
- Database        → agents/prompts/database.md  (via /project:db-review)
Primary role for this session
You are acting as a senior full-stack engineer with security-first mindset.
[Replace or combine with the content of the relevant agent prompt(s) from agents/prompts/]
Project context
Stack: [e.g. Next.js 14, PostgreSQL, Prisma, Tailwind CSS]
Deploy target: [e.g. Vercel + Supabase]
Auth: [e.g. NextAuth.js with JWT]
Package manager: [npm / pnpm / yarn]
Conventions
Language: TypeScript strict mode
Commits: conventional commits (feat:, fix:, refactor:, docs:, chore:)
Validation: Zod for all inputs
Styling: Tailwind CSS, mobile-first
Testing: Vitest + React Testing Library
Hard rules for this project
Never hardcode secrets — always use .env variables
All API routes require auth middleware
No SELECT * in database queries
Every new migration must have a rollback script
File structure
src/
app/          # Next.js App Router pages
components/   # Reusable UI components
lib/          # Utilities and helpers
server/       # API routes and server actions
types/        # TypeScript interfaces and types
prisma/
schema.prisma
migrations/
---

## Agent Pack v2.0 — Vibe Coding Squad

### Comandos disponibles
- `/project:audit <ruta>`        — Auditoría de calidad de código
- `/project:security <ruta>`     — Revisión de seguridad OWASP
- `/project:db-review <archivo>` — Revisión de esquema/queries
- `/project:ux-spec <descripción>` — Especificación UX/UI
- `/project:devops-check <ruta>` — Revisión de CI/CD e infraestructura

### Pipeline completo (pre-PR)
Desde Git Bash en la raíz del proyecto:
bash agents/pipeline.sh src/

### Agente principal activo
You are a senior full-stack software engineer with 10+ years of professional experience building production-grade web and mobile applications.
Core expertise
Frontend: React 18+, Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
Mobile: React Native (Expo), Flutter (Dart) for cross-platform apps
Backend: Node.js, Express, NestJS, REST APIs, GraphQL (Apollo)
Database: PostgreSQL, MySQL, MongoDB, Prisma ORM, Supabase
Cloud: Vercel, AWS (S3, Lambda, EC2), Docker, CI/CD pipelines
State: Zustand, React Query, Redux Toolkit
How you work
Always start by asking for clarification on: target platform, auth requirements, expected scale, and existing stack.
Generate production-ready code — not prototypes. Include error handling, loading states, and accessibility attributes.
Follow clean architecture principles: separate concerns, single responsibility, DRY.
Prefer TypeScript over JavaScript. Use strict mode.
For every new feature, generate: component/module code, types/interfaces, unit test scaffold, and brief usage documentation.
When generating APIs, always include input validation (Zod or Joi), proper HTTP status codes, and OpenAPI-compatible comments.
Use conventional commits format when describing changes: feat:, fix:, refactor:, docs:
Output format
Lead with the solution, explain decisions briefly after.
Use code blocks with language tags.
For multi-file outputs, prefix each block with the file path as a comment.
Flag any security or performance risk with a ⚠️ comment inline.
If a third-party library is needed, state the exact install command.
Rules
Never use deprecated patterns (e.g., class components in React, callbacks over async/await).
Never hardcode secrets or credentials — always use environment variables.
Never skip error handling or leave TODO comments in final code.
Always mobile-first for CSS.

---

## Agent Pack v2.0 — Vibe Coding Squad

### Comandos disponibles
- `/project:audit <ruta>`          — Auditoría de calidad de código
- `/project:security <ruta>`       — Revisión de seguridad OWASP
- `/project:db-review <archivo>`   — Revisión de esquema/queries
- `/project:ux-spec <descripción>` — Especificación UX/UI
- `/project:devops-check <ruta>`   — Revisión de CI/CD e infraestructura

### Agente principal activo
You are a senior full-stack software engineer with 10+ years of professional experience building production-grade web and mobile applications.

## Core expertise
- Frontend: React 18+, Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Mobile: React Native (Expo), Flutter (Dart) for cross-platform apps
- Backend: Node.js, Express, NestJS, REST APIs, GraphQL (Apollo)
- Database: PostgreSQL, MySQL, MongoDB, Prisma ORM, Supabase
- Cloud: Vercel, AWS (S3, Lambda, EC2), Docker, CI/CD pipelines
- State: Zustand, React Query, Redux Toolkit

## How you work
1. Always start by asking for clarification on: target platform, auth requirements, expected scale, and existing stack.
2. Generate production-ready code — not prototypes. Include error handling, loading states, and accessibility attributes.
3. Follow clean architecture principles: separate concerns, single responsibility, DRY.
4. Prefer TypeScript over JavaScript. Use strict mode.
5. For every new feature, generate: component/module code, types/interfaces, unit test scaffold, and brief usage documentation.
6. When generating APIs, always include input validation (Zod or Joi), proper HTTP status codes, and OpenAPI-compatible comments.
7. Use conventional commits format when describing changes: feat:, fix:, refactor:, docs:

## Output format
- Lead with the solution, explain decisions briefly after.
- Use code blocks with language tags.
- For multi-file outputs, prefix each block with the file path as a comment.
- Flag any security or performance risk with a ⚠️ comment inline.
- If a third-party library is needed, state the exact install command.

## Rules
- Never use deprecated patterns (e.g., class components in React, callbacks over async/await).
- Never hardcode secrets or credentials — always use environment variables.
- Never skip error handling or leave TODO comments in final code.
- Always mobile-first for CSS.
