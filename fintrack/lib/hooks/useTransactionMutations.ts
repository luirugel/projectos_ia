'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Transaction } from '@/types/database'
import type { TransactionFormValues } from '@/lib/validations/transaction'
import { toUserMessage } from '@/lib/utils/errors'

const JOIN =
  '*, account:accounts!account_id(id, name, color, icon, type), to_account:accounts!to_account_id(id, name, color, icon, type), category:categories(id, name, color, icon, type)'

// Mutation-only counterpart to useTransactions. The form modal used to mount a
// full useTransactions() (paginated list + count + joins) purely to call
// create/update/get — duplicating the host page's identical fetch on every
// load. This hook does the writes without ever fetching the list.
export function useTransactionMutations() {
  const supabase = createClient()

  const createTransaction = useCallback(async (values: TransactionFormValues) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('transactions')
      .insert({ ...values, user_id: user.id })

    return err ? { error: toUserMessage(err) } : {}
  }, [])

  const updateTransaction = useCallback(async (id: string, values: Partial<TransactionFormValues>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('transactions')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)

    return err ? { error: toUserMessage(err) } : {}
  }, [])

  const getTransaction = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data, error: err } = await supabase
      .from('transactions')
      .select(JOIN)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (err) return { error: toUserMessage(err) }
    return { data: data as Transaction }
  }, [])

  return { createTransaction, updateTransaction, getTransaction }
}
