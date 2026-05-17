'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardSummary, DashboardPeriod, Category, Account, AccountBalance } from '@/types/database'
import { getPeriodRange, getPrevPeriodRange, getCurrentYearRange } from '@/lib/utils/dates'
import { toUserMessage } from '@/lib/utils/errors'

const BALANCE_COLUMNS = 'id, user_id, name, type, color, icon, current_balance'

interface UseDashboardSummaryReturn {
  summary: DashboardSummary | null
  loading: boolean
  error: string | null
  periodType: DashboardPeriod
  setPeriodType: (p: DashboardPeriod) => void
  refresh: () => Promise<void>
}

export function useDashboardSummary(): UseDashboardSummaryReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodType, setPeriodType] = useState<DashboardPeriod>('month')
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const period = getPeriodRange(periodType)
    const prevPeriod = getPrevPeriodRange(periodType)
    const ytdPeriod = getCurrentYearRange()
    const { start, end } = period

    const [incomeRes, expenseRes, categoryRes, accountRes, prevIncomeRes, prevExpenseRes, ytdRes, dailyRes] =
      await Promise.all([
        supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'income').gte('date', start).lte('date', end),
        supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').gte('date', start).lte('date', end),
        supabase.from('transactions').select('amount, category:categories(id, name, color, icon, type)').eq('user_id', user.id).eq('type', 'expense').gte('date', start).lte('date', end),
        supabase.from('account_balances').select(BALANCE_COLUMNS).eq('user_id', user.id),
        supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'income').gte('date', prevPeriod.start).lte('date', prevPeriod.end),
        supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').gte('date', prevPeriod.start).lte('date', prevPeriod.end),
        supabase.from('transactions').select('amount, type').eq('user_id', user.id).in('type', ['income', 'expense']).gte('date', ytdPeriod.start).lte('date', ytdPeriod.end),
        supabase.from('transactions').select('date, amount, type').eq('user_id', user.id).in('type', ['income', 'expense']).gte('date', start).lte('date', end).order('date', { ascending: true }),
      ])

    if (incomeRes.error) { setError(toUserMessage(incomeRes.error)); setLoading(false); return }

    const total_income = (incomeRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0)
    const total_expenses = (expenseRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0)
    const net_balance = total_income - total_expenses
    const prev_income = (prevIncomeRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0)
    const prev_expenses = (prevExpenseRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0)

    const ytdIncome = (ytdRes.data ?? []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const ytdExpenses = (ytdRes.data ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const ytd_balance = ytdIncome - ytdExpenses

    // Daily buckets
    const incomeMap: Record<string, number> = {}
    const expenseMap: Record<string, number> = {}
    for (const tx of (dailyRes.data ?? [])) {
      if (tx.type === 'income') incomeMap[tx.date] = (incomeMap[tx.date] ?? 0) + Number(tx.amount)
      if (tx.type === 'expense') expenseMap[tx.date] = (expenseMap[tx.date] ?? 0) + Number(tx.amount)
    }
    const daily_income = Object.entries(incomeMap).map(([date, amount]) => ({ date, amount }))
    const daily_expense = Object.entries(expenseMap).map(([date, amount]) => ({ date, amount }))

    // Category breakdown — deduplicate by name so system + user categories with the same name merge
    const nameMap = new Map<string, { category: Category; total: number; count: number }>()
    for (const tx of (categoryRes.data ?? [])) {
      if (!tx.category) continue
      // Supabase may return the join as a single object or a single-element array
      const raw = tx.category
      const cat: Category = (Array.isArray(raw) ? raw[0] : raw) as Category
      if (!cat?.id) continue
      const key = cat.name.toLowerCase().trim()
      const existing = nameMap.get(key)
      if (existing) { existing.total += Number(tx.amount); existing.count += 1 }
      else nameMap.set(key, { category: cat, total: Number(tx.amount), count: 1 })
    }
    const by_category = Array.from(nameMap.values())
      .map(({ category, total, count }) => ({ category, total, percentage: total_expenses > 0 ? (total / total_expenses) * 100 : 0, transaction_count: count }))
      .sort((a, b) => b.total - a.total)

    const accounts_balance = ((accountRes.data ?? []) as unknown as AccountBalance[]).map((a) => ({
      account: { ...a, initial_balance: 0, is_active: true, created_at: '' } as Account,
      balance: Number(a.current_balance ?? 0),
    }))

    setSummary({ period, periodType, total_income, total_expenses, net_balance, prev_income, prev_expenses, ytd_balance, daily_income, daily_expense, by_category, accounts_balance })
    setLoading(false)
  }, [periodType])

  useEffect(() => { fetch() }, [fetch])

  return { summary, loading, error, periodType, setPeriodType, refresh: fetch }
}
