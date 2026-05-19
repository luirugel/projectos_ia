'use client'

import { useEffect, useRef, useState } from 'react'
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

function useInViewOnce(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function daysUntilReset(period: 'weekly' | 'monthly' | 'yearly'): number {
  const now = new Date()
  if (period === 'weekly') return Math.max(0, differenceInDays(endOfWeek(now, { weekStartsOn: 1 }), now))
  if (period === 'yearly') return Math.max(0, differenceInDays(endOfYear(now), now))
  return Math.max(0, differenceInDays(endOfMonth(now), now))
}

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-expense'
  if (pct >= 80)  return 'bg-amber-400'
  return 'bg-primary'
}

function pctColor(pct: number): string {
  if (pct >= 100) return 'text-expense'
  if (pct >= 80)  return 'text-amber-500'
  return 'text-app-text-subtle'
}

export function BudgetProgressList({ budgets, loading }: BudgetProgressListProps) {
  const [containerRef, visible] = useInViewOnce(0.1)
  const reducedMotion = useReducedMotion()

  const alertBudgets = budgets.filter((b) => (b.percentage ?? 0) >= 60)
  const alertCount = alertBudgets.length
  const displayList = (alertBudgets.length > 0 ? alertBudgets : budgets).slice(0, 5)

  const shouldAnimate = !reducedMotion && visible

  return (
    <div ref={containerRef} className="bg-app-surface rounded-2xl border border-app-border/40 flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-app-border/40">
        <div>
          <h2 className="text-base font-bold text-app-text">Presupuestos</h2>
          <p className="text-xs text-app-text-subtle mt-0.5">
            {loading
              ? '—'
              : alertCount > 0
              ? `${alertCount} de ${budgets.length} cerca del límite`
              : 'Todos bajo control'}
          </p>
        </div>
        <Link
          href="/budgets"
          className="group flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 mt-0.5"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-app-border/30">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full bg-app-surface-alt shrink-0" />
                <Skeleton className="h-3.5 w-24 bg-app-surface-alt" />
                <Skeleton className="h-3.5 w-10 bg-app-surface-alt ml-auto" />
              </div>
              <Skeleton className="h-1.5 w-full bg-app-surface-alt rounded-full" />
            </div>
          ))
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
            <ShieldCheck className="h-7 w-7 text-app-text-subtle/40" strokeWidth={1.5} />
            <p className="text-sm text-app-text-subtle text-center">Sin presupuestos</p>
            <p className="text-xs text-app-text-subtle/70 text-center">Crea uno para controlar tus gastos</p>
          </div>
        ) : (
          displayList.map((budget, i) => {
            const pct = budget.percentage ?? 0
            const fillPct = Math.min(pct, 100)
            const available = budget.amount_limit - (budget.spent ?? 0)
            const resetDays = daysUntilReset(budget.period)

            return (
              <div
                key={budget.id}
                className="px-5 py-3 space-y-2 hover:bg-app-surface-alt/40 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5">
                  <CategoryIcon icon={budget.category?.icon ?? 'tag'} color={budget.category?.color} size="sm" />
                  <span className="text-sm font-semibold text-app-text flex-1 truncate">{budget.category?.name}</span>
                  <span className={`text-xs font-bold tabular-nums font-mono ${pctColor(pct)}`}>
                    {pct.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar — fills from 0 once in view */}
                <div className="h-1.5 w-full rounded-full overflow-hidden bg-app-surface-alt">
                  <div
                    className={`h-full rounded-full bar-shimmer ${barColor(pct)}`}
                    style={{
                      width: shouldAnimate
                        ? `${Math.max(fillPct, fillPct > 0 ? 2 : 0)}%`
                        : '0%',
                      transition: shouldAnimate
                        ? `width 650ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 60}ms`
                        : 'none',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-app-text-subtle tabular-nums">
                    {formatCurrency(budget.spent ?? 0)} / {formatCurrency(budget.amount_limit)}
                  </span>
                  <span className="text-xs text-app-text-subtle">
                    {pct >= 100
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
