'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Transaction } from '@/types/database'
import type { TransactionFormValues } from '@/lib/validations/transaction'
import { toUserMessage } from '@/lib/utils/errors'

export interface TransactionFilters {
  start?: string
  end?: string
  type?: 'expense' | 'income' | 'transfer'
  account_id?: string
  category_id?: string
  search?: string
}

export type TransactionSortColumn = 'date' | 'amount' | 'type' | 'account'
export interface TransactionSort {
  column: TransactionSortColumn
  direction: 'asc' | 'desc'
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  totalCount: number
  page: number
  setPage: (page: number) => void
  filters: TransactionFilters
  setFilters: (filters: TransactionFilters) => void
  sort: TransactionSort
  setSort: (column: TransactionSortColumn) => void
  refresh: () => Promise<void>
  createTransaction: (values: TransactionFormValues) => Promise<{ error?: string }>
  updateTransaction: (id: string, values: Partial<TransactionFormValues>) => Promise<{ error?: string }>
  deleteTransaction: (id: string) => Promise<{ error?: string }>
  getTransaction: (id: string) => Promise<{ data?: Transaction; error?: string }>
}

export const PAGE_SIZE = 20

export function useTransactions(initialFilters?: TransactionFilters): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [filters, setFiltersState] = useState<TransactionFilters>(initialFilters ?? {})
  const [sort, setSortState] = useState<TransactionSort>({ column: 'date', direction: 'desc' })
  const supabase = createClient()

  const setFilters = useCallback((f: TransactionFilters) => {
    setFiltersState(f)
    setPage(0)
  }, [])

  // Toggle direction when re-clicking the same column, else default desc.
  const setSort = useCallback((column: TransactionSortColumn) => {
    setSortState((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'desc' },
    )
    setPage(0)
  }, [])

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts!account_id(id, name, color, icon, type),
        to_account:accounts!to_account_id(id, name, color, icon, type),
        category:categories(id, name, color, icon, type)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const asc = sort.direction === 'asc'
    if (sort.column === 'amount') {
      query = query.order('amount', { ascending: asc }).order('date', { ascending: false })
    } else if (sort.column === 'type') {
      query = query.order('type', { ascending: asc }).order('date', { ascending: false })
    } else if (sort.column === 'account') {
      // Order by the embedded account's name (to-one relation, alias "account").
      query = query
        .order('name', { referencedTable: 'account', ascending: asc })
        .order('date', { ascending: false })
    } else {
      query = query.order('date', { ascending: asc }).order('created_at', { ascending: asc })
    }

    if (filters.start) query = query.gte('date', filters.start)
    if (filters.end) query = query.lte('date', filters.end)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.account_id) query = query.eq('account_id', filters.account_id)
    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.search) query = query.ilike('description', `%${filters.search.slice(0, 100)}%`)

    const { data, error: err, count } = await query

    if (err) setError(toUserMessage(err))
    else {
      setTransactions((data ?? []) as Transaction[])
      setTotalCount(count ?? 0)
    }

    setLoading(false)
  }, [filters, page, sort])

  useEffect(() => { fetch() }, [fetch])

  const createTransaction = useCallback(async (values: TransactionFormValues) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('transactions')
      .insert({ ...values, user_id: user.id })

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const updateTransaction = useCallback(async (id: string, values: Partial<TransactionFormValues>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('transactions')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const deleteTransaction = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error: err } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const getTransaction = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data, error: err } = await supabase
      .from('transactions')
      .select(`*, account:accounts!account_id(id, name, color, icon, type), to_account:accounts!to_account_id(id, name, color, icon, type), category:categories(id, name, color, icon, type)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (err) return { error: toUserMessage(err) }
    return { data: data as Transaction }
  }, [])

  return {
    transactions, loading, error, totalCount,
    page, setPage, filters, setFilters, sort, setSort,
    refresh: fetch, createTransaction, updateTransaction, deleteTransaction, getTransaction,
  }
}
