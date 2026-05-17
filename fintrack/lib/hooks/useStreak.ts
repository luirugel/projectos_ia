'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { startOfDay, subDays, format } from 'date-fns'

interface StreakState {
  /** Consecutive days (ending today or yesterday) with at least one logged
   *  movement. Yesterday still counts so a not-yet-logged today never
   *  "breaks" the streak mid-day — PRODUCT.md: never shame a missed day. */
  streak: number
  /** Last 7 calendar days, oldest → newest: did the user log that day. */
  week: boolean[]
  /** Whether anything was logged today (drives encouraging, honest copy). */
  loggedToday: boolean
  loading: boolean
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

export function useStreak(): StreakState {
  const [state, setState] = useState<StreakState>({
    streak: 0,
    week: [false, false, false, false, false, false, false],
    loggedToday: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (!cancelled) setState((s) => ({ ...s, loading: false })); return }

      const since = iso(subDays(startOfDay(new Date()), 45))
      const { data } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', since)

      if (cancelled) return

      const days = new Set<string>((data ?? []).map((r) => r.date as string))
      const today = startOfDay(new Date())

      const loggedToday = days.has(iso(today))
      // Start counting from today if logged, else from yesterday (grace).
      let cursor = loggedToday ? today : subDays(today, 1)
      let streak = 0
      // Cap the walk at 45 (query window) to stay bounded.
      for (let i = 0; i < 45; i++) {
        if (days.has(iso(cursor))) {
          streak++
          cursor = subDays(cursor, 1)
        } else {
          break
        }
      }

      const week = Array.from({ length: 7 }, (_, i) =>
        days.has(iso(subDays(today, 6 - i))),
      )

      setState({ streak, week, loggedToday, loading: false })
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
