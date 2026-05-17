'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { endOfMonth, endOfWeek, endOfYear, differenceInDays } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatCurrency } from '@/lib/utils/currency'
import type { Budget } from '@/types/database'

interface BudgetProgressListProps {
  budgets: Budget[]
  loading: boolean
}

function daysUntilReset(period: 'weekly' | 'monthly' | 'yearly'): number {
  const now = new Date()
  if (period === 'weekly') return Math.max(0, differenceInDays(endOfWeek(now, { weekStartsOn: 1 }), now))
  if (period === 'yearly') return Math.max(0, differenceInDays(endOfYear(now), now))
  return Math.max(0, differenceInDays(endOfMonth(now), now))
}

type Status = 'exceeded' | 'warning' | 'attention' | 'healthy'

function getStatus(pct: number): Status {
  if (pct >= 100) return 'exceeded'
  if (pct >= 80)  return 'warning'
  if (pct >= 60)  return 'attention'
  return 'healthy'
}

const statusConfig: Record<Status, { label: string; badge: string; bar: string; barBg: string }> = {
  exceeded:  { label: 'Excedido',  badge: 'bg-expense/10 text-expense',             bar: 'bg-expense',      barBg: 'bg-expense/10' },
  warning:   { label: 'Alerta',    badge: 'bg-orange-400/10 text-orange-500',        bar: 'bg-orange-400',   barBg: 'bg-orange-400/10' },
  attention: { label: 'Cerca',     badge: 'bg-yellow-400/10 text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-400', barBg: 'bg-yellow-400/10' },
  healthy:   { label: 'OK',        badge: 'bg-income/10 text-income',               bar: 'bg-income',       barBg: 'bg-income/8' },
}

export function BudgetProgressList({ budgets, loading }: BudgetProgressListProps) {
  const alertBudgets = budgets.filter((b) => (b.percentage ?? 0) >= 60)
  const alertCount = alertBudgets.length
  const displayList = (alertBudgets.length > 0 ? alertBudgets : budgets).slice(0, 5)

  return (
    <div
      className="bg-app-surface rounded-2xl border border-app-border/40 flex flex-col overflow-hidden"
      style={{ boxShadow: 'var(--app-shadow-md)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-app-border/40">
        <div>
          <h2 className="text-base font-bold text-app-text">Alertas de presupuesto</h2>
          <p className="text-xs text-app-text-subtle mt-0.5">
            {loading
              ? '—'
              : alertCount > 0
              ? `${alertCount} de ${budgets.length} categorías cerca del límite`
              : 'Todos los presupuestos bajo control'}
          </p>
        </div>
        <Link
          href="/budgets"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 mt-0.5"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-app-border/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full bg-app-surface-alt shrink-0" />
                <Skeleton className="h-3.5 w-24 bg-app-surface-alt" />
                <Skeleton className="h-3.5 w-20 bg-app-surface-alt ml-auto" />
              </div>
              <Skeleton className="h-2 w-full bg-app-surface-alt rounded-full" />
            </div>
          ))
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-4">
            <ShieldCheck className="h-8 w-8 text-app-text-subtle/40" strokeWidth={1.5} />
            <p className="text-sm text-app-text-subtle text-center">Sin presupuestos creados</p>
            <p className="text-xs text-app-text-subtle/70 text-center">Crea uno para controlar tus gastos</p>
          </div>
        ) : (
          displayList.map((budget) => {
            const pct = budget.percentage ?? 0
            const status = getStatus(pct)
            const cfg = statusConfig[status]
            const fillPct = Math.min(pct, 100)
            const available = budget.amount_limit - (budget.spent ?? 0)
            const resetDays = daysUntilReset(budget.period)

            return (
              <div key={budget.id} className="px-5 py-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <CategoryIcon icon={budget.category?.icon ?? 'tag'} color={budget.category?.color} size="sm" />
                  <span className="text-sm font-semibold text-app-text flex-1 truncate">{budget.category?.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {pct.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${cfg.barBg}`}>
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${cfg.bar}`}
                    style={{ width: `${Math.max(fillPct, fillPct > 0 ? 2 : 0)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-app-text-subtle tabular-nums">
                    {formatCurrency(budget.spent ?? 0)} / {formatCurrency(budget.amount_limit)}
                  </span>
                  <span className="text-xs text-app-text-subtle font-medium">
                    {status === 'exceeded'
                      ? `Reinicia en ${resetDays}d`
                      : `${formatCurrency(Math.max(available, 0))} libres`}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
