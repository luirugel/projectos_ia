'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, CategoryType } from '@/types/database'
import { toUserMessage } from '@/lib/utils/errors'

const CATEGORY_COLUMNS = 'id, user_id, name, type, icon, color, is_active, created_at'

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createCategory: (values: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<{ error?: string }>
  deleteCategory: (id: string) => Promise<{ error?: string }>
}

export function useCategories(typeFilter?: CategoryType): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq('is_active', true)
      .order('name')

    if (typeFilter && typeFilter !== 'both') {
      query = query.in('type', [typeFilter, 'both'])
    }

    const { data, error: err } = await query
    if (err) { setError(toUserMessage(err)); setLoading(false); return }

    // Deduplicate by name — prefer user-created over system (user_id IS NULL)
    const nameMap = new Map<string, Category>()
    for (const cat of (data ?? []) as Category[]) {
      const key = cat.name.toLowerCase().trim()
      const existing = nameMap.get(key)
      if (!existing || cat.user_id !== null) {
        nameMap.set(key, cat)
      }
    }
    setCategories(Array.from(nameMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es')))
    setLoading(false)
  }, [typeFilter])

  useEffect(() => { fetch() }, [fetch])

  const createCategory = useCallback(async (values: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    const { error: err } = await supabase.from('categories').insert({ ...values, user_id: user.id })
    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  const deleteCategory = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }
    // Scope by user_id so a system category (user_id IS NULL) can never be
    // soft-deleted from the client; RLS is the real guard, this is defense-in-depth.
    const { error: err } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
    if (err) return { error: toUserMessage(err) }
    await fetch()
    return {}
  }, [fetch])

  return { categories, loading, error, refresh: fetch, createCategory, deleteCategory }
}
