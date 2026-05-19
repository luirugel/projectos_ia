'use client'

import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import type { DashboardSummary } from '@/types/database'

interface SummaryCardsProps {
  summary: DashboardSummary | null
  loading: boolean
  periodLabel?: string
}

const SAVINGS_GOAL = 35

export function SummaryCards({ summary, loading, periodLabel = 'período' }: SummaryCardsProps) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-app-surface border border-app-border/40 rounded-xl p-4 space-y-2.5">
            <Skeleton className="h-3 w-20 bg-app-surface-alt" />
            <Skeleton className="h-7 w-28 bg-app-surface-alt" />
            <Skeleton className="h-3 w-16 bg-app-surface-alt" />
          </div>
        ))}
      </div>
    )
  }

  const income = summary.total_income ?? 0
  const expenses = summary.total_expenses ?? 0
  const net = income - expenses
  const savingsRate = income > 0 ? Math.max((net / income) * 100, 0) : null
  const negative = net < 0
  const hasPrev = (summary.prev_income ?? 0) > 0 || (summary.prev_expenses ?? 0) > 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

      {/* Net Balance */}
      <div className="col-span-2 lg:col-span-1 bg-app-surface border border-app-border/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <Wallet className="h-3.5 w-3.5 text-app-text-subtle" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle">Balance</span>
        </div>
        <p
          className={`text-2xl font-bold tabular-nums font-mono leading-none ${negative ? 'text-expense' : 'text-app-text'}`}
          aria-label={`Balance del ${periodLabel}: ${negative ? 'menos ' : ''}${formatCurrency(Math.abs(net))}`}
        >
          {negative ? '−' : ''}{formatCurrency(Math.abs(net))}
        </p>
        <p className="text-xs text-app-text-subtle mt-2">
          {hasPrev ? `antes ${formatCurrency(Math.abs((summary.prev_income ?? 0) - (summary.prev_expenses ?? 0)))}` : `este ${periodLabel}`}
        </p>
      </div>

      {/* Income */}
      <div className="bg-app-surface border border-app-border/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-income" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle">Ingresos</span>
        </div>
        <p className="text-2xl font-bold tabular-nums font-mono leading-none text-income">
          {formatCurrency(income)}
        </p>
        <p className="text-xs text-app-text-subtle mt-2 tabular-nums">
          {hasPrev ? `antes ${formatCurrency(summary.prev_income ?? 0)}` : `este ${periodLabel}`}
        </p>
      </div>

      {/* Expenses */}
      <div className="bg-app-surface border border-app-border/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingDown className="h-3.5 w-3.5 text-expense" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle">Gastos</span>
        </div>
        <p className="text-2xl font-bold tabular-nums font-mono leading-none text-expense">
          {formatCurrency(expenses)}
        </p>
        <p className="text-xs text-app-text-subtle mt-2 tabular-nums">
          {hasPrev ? `antes ${formatCurrency(summary.prev_expenses ?? 0)}` : `este ${periodLabel}`}
        </p>
      </div>

      {/* Savings Rate */}
      <div className="bg-app-surface border border-app-border/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <PiggyBank className="h-3.5 w-3.5 text-app-text-subtle" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle">Ahorro</span>
        </div>
        <p className={`text-2xl font-bold tabular-nums font-mono leading-none ${savingsRate !== null && savingsRate >= SAVINGS_GOAL ? 'text-income' : 'text-app-text'}`}>
          {savingsRate === null ? '—' : `${savingsRate.toFixed(1)}%`}
        </p>
        <p className="text-xs text-app-text-subtle mt-2">
          {savingsRate === null
            ? 'Registra ingresos'
            : savingsRate >= SAVINGS_GOAL
            ? `Meta (${SAVINGS_GOAL}%) alcanzada`
            : `Meta: ${SAVINGS_GOAL}%`}
        </p>
      </div>

    </div>
  )
}
