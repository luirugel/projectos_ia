'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Budget } from '@/types/database'
import type { BudgetFormValues } from '@/lib/validations/budget'
import { toUserMessage } from '@/lib/utils/errors'

const BUDGET_COLUMNS =
  'id, user_id, category_id, amount_limit, period, alert_at_50, alert_at_80, alert_at_100, rollover, is_active, created_at, category:categories(id, name, color, icon, type)'

interface UseBudgetsReturn {
  budgets: Budget[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createBudget: (values: BudgetFormValues) => Promise<{ error?: string }>
  updateBudget: (id: string, values: Partial<BudgetFormValues>) => Promise<{ error?: string }>
  deleteBudget: (id: string) => Promise<{ error?: string }>
}

export function useBudgets(): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Two set-based queries instead of the old N+1 (one tx query per budget):
    // the budgets with their category, and the budget_progress view which
    // computes current-period spend in a single pass (name-matched, so it
    // stays consistent with the dashboard's category name-merge).
    const [budgetRes, progressRes] = await Promise.all([
      supabase
        .from('budgets')
        .select(BUDGET_COLUMNS)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('budget_progress')
        .select('id, spent')
        .eq('user_id', user.id),
    ])

    if (budgetRes.error) { setError(toUserMessage(budgetRes.error)); setLoading(false); return }

    const spentById = new Map<string, number>(
      (progressRes.data ?? []).map((r) => [r.id as string, Number(r.spent)]),
    )

    const enriched = (budgetRes.data ?? []).map((budget) => {
      const spent = spentById.get(budget.id) ?? 0
      const percentage = Math.min((spent / budget.amount_limit) * 100, 999)
      return { ...budget, spent, percentage } as unknown as Budget
    })

    setBudgets(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createBudget = useCallback(async (values: BudgetFormValues) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('budgets')
      .insert({ ...values, user_id: user.id })

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const updateBudget = useCallback(async (id: string, values: Partial<BudgetFormValues>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('budgets')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const deleteBudget = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('budgets')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  return { budgets, loading, error, refresh: fetch, createBudget, updateBudget, deleteBudget }
}
