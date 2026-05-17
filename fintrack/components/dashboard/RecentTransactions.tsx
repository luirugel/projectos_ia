'use client'

import Link from 'next/link'
import { ArrowRight, Receipt } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateRelative } from '@/lib/utils/dates'
import type { Transaction } from '@/types/database'

interface RecentTransactionsProps {
  transactions: Transaction[]
  loading: boolean
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  const count = transactions.length
  const weekCount = transactions.filter((t) => {
    const d = new Date(t.date)
    const now = new Date()
    return (now.getTime() - d.getTime()) / 86400000 <= 7
  }).length

  return (
    <div
      className="bg-app-surface rounded-2xl border border-app-border/40 flex flex-col overflow-hidden"
      style={{ boxShadow: 'var(--app-shadow-md)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-app-border/40">
        <div>
          <h2 className="text-base font-bold text-app-text">Transacciones recientes</h2>
          <p className="text-xs text-app-text-subtle mt-0.5">
            {loading ? '—' : `${count} movimientos · ${weekCount} esta semana`}
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 mt-0.5"
        >
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-app-border/30">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full bg-app-surface-alt shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32 bg-app-surface-alt" />
                <Skeleton className="h-3 w-20 bg-app-surface-alt" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-3.5 w-16 bg-app-surface-alt" />
                <Skeleton className="h-3 w-10 bg-app-surface-alt" />
              </div>
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-4">
            <Receipt className="h-8 w-8 text-app-text-subtle/40" strokeWidth={1.5} />
            <p className="text-sm text-app-text-subtle text-center">Sin transacciones este mes</p>
            <p className="text-xs text-app-text-subtle/70 text-center">Registra un gasto o ingreso para empezar</p>
          </div>
        ) : (
          transactions.slice(0, 7).map((tx) => (
            <Link
              key={tx.id}
              href={`/transactions/${tx.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-app-surface-alt/50 transition-colors duration-150 group"
            >
              <CategoryIcon
                icon={tx.category?.icon ?? (tx.type === 'income' ? 'plus-circle' : 'tag')}
                color={tx.category?.color ?? (tx.type === 'income' ? '#10b981' : '#6366f1')}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-app-text truncate leading-tight">
                  {tx.description ?? tx.category?.name ?? 'Sin descripción'}
                </p>
                <p className="text-xs text-app-text-subtle truncate mt-0.5">
                  {tx.account?.name ?? '—'} · {formatDateRelative(tx.date)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-sm font-bold tabular-nums ${
                    tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-primary'
                  }`}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{formatCurrency(tx.amount)}
                </span>
                <span className="text-xs text-app-text-subtle">
                  {tx.category?.name ?? (tx.type === 'income' ? 'Ingreso' : tx.type === 'transfer' ? 'Transf.' : 'Gasto')}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
