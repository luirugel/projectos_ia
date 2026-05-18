'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Goal, GoalContribution } from '@/types/database'
import type { GoalFormValues, GoalContributionFormValues } from '@/lib/validations/goal'
import { daysRemaining } from '@/lib/utils/dates'
import { toUserMessage } from '@/lib/utils/errors'

const GOAL_COLUMNS =
  'id, user_id, name, description, target_amount, current_amount, target_date, icon, color, status, created_at, updated_at'
const CONTRIBUTION_COLUMNS = 'id, goal_id, user_id, amount, note, date, created_at'

interface UseGoalsReturn {
  goals: Goal[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createGoal: (values: GoalFormValues) => Promise<{ error?: string }>
  updateGoal: (id: string, values: Partial<GoalFormValues>) => Promise<{ error?: string }>
  deleteGoal: (id: string) => Promise<{ error?: string }>
  addContribution: (goalId: string, values: GoalContributionFormValues) => Promise<{ error?: string }>
  getContributions: (goalId: string) => Promise<GoalContribution[]>
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('goals')
      .select(GOAL_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (err) { setError(toUserMessage(err)); setLoading(false); return }

    const enriched = (data ?? []).map((goal) => {
      const percentage = goal.target_amount > 0
        ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
        : 0
      const days_remaining = goal.target_date ? daysRemaining(goal.target_date) : undefined
      return { ...goal, percentage, days_remaining } as Goal
    })

    setGoals(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createGoal = useCallback(async (values: GoalFormValues) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('goals')
      .insert({ ...values, user_id: user.id })

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const updateGoal = useCallback(async (id: string, values: Partial<GoalFormValues>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('goals')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const deleteGoal = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const addContribution = useCallback(async (goalId: string, values: GoalContributionFormValues) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // current_amount + status are recomputed atomically by the
    // goal_contributions_recompute DB trigger (migration 002) — never
    // touched from the client to avoid lost updates / stale-cache races.
    const { error: err } = await supabase
      .from('goal_contributions')
      .insert({ ...values, goal_id: goalId, user_id: user.id })

    if (err) return { error: toUserMessage(err) }

    await fetch()
    return {}
  }, [fetch])

  const getContributions = useCallback(async (goalId: string): Promise<GoalContribution[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('goal_contributions')
      .select(CONTRIBUTION_COLUMNS)
      .eq('goal_id', goalId)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    return (data ?? []) as GoalContribution[]
  }, [])

  return { goals, loading, error, refresh: fetch, createGoal, updateGoal, deleteGoal, addContribution, getContributions }
}
