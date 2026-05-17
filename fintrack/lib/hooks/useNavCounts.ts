'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavCounts {
  transactions: number
  accounts: number
  goals: number
}

export function useNavCounts() {
  const [counts, setCounts] = useState<NavCounts>({ transactions: 0, accounts: 0, goals: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [txRes, accRes, goalRes] = await Promise.all([
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
      supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    ])

    setCounts({
      transactions: txRes.count ?? 0,
      accounts: accRes.count ?? 0,
      goals: goalRes.count ?? 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { ...counts, loading, refresh }
}
