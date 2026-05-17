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

/** Row shape of the `account_balances` SQL view (no initial_balance/is_active). */
export interface AccountBalance {
  id: string
  user_id: string
  name: string
  type: AccountType
  color: string
  icon: string
  current_balance: number
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

export type DashboardPeriod = 'week' | 'month' | 'quarter' | 'year'

export interface DashboardSummary {
  period: { start: string; end: string }
  periodType: DashboardPeriod
  total_income: number
  total_expenses: number
  net_balance: number
  prev_income: number
  prev_expenses: number
  ytd_balance: number
  daily_income: Array<{ date: string; amount: number }>
  daily_expense: Array<{ date: string; amount: number }>
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
