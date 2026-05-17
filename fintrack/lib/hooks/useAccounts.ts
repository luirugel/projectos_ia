'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/types/database'
import type { AccountFormValues } from '@/lib/validations/account'
import { toUserMessage } from '@/lib/utils/errors'

const BALANCE_COLUMNS = 'id, user_id, name, type, color, icon, current_balance'
const ACCOUNT_COLUMNS = 'id, user_id, name, type, initial_balance, color, icon, is_active, created_at'

interface UseAccountsReturn {
  accounts: Account[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createAccount: (values: AccountFormValues) => Promise<{ error?: string }>
  updateAccount: (id: string, values: Partial<AccountFormValues>) => Promise<{ error?: string }>
  deleteAccount: (id: string) => Promise<{ error?: string }>
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('account_balances')
      .select(BALANCE_COLUMNS)
      .eq('user_id', user.id)
      .order('name')

    if (err) {
      // Fallback to accounts table if the view doesn't exist yet
      const { data: fallback, error: fallbackErr } = await supabase
        .from('accounts')
        .select(ACCOUNT_COLUMNS)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (fallbackErr) setError(toUserMessage(fallbackErr))
      else setAccounts((fallback ?? []) as Account[])
    } else {
      setAccounts((data ?? []) as Account[])
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createAccount = useCallback(async (values: AccountFormValues) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('accounts')
      .insert({ ...values, user_id: user.id })

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const updateAccount = useCallback(async (id: string, values: Partial<AccountFormValues>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('accounts')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const deleteAccount = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  return { accounts, loading, error, refresh: fetch, createAccount, updateAccount, deleteAccount }
}
