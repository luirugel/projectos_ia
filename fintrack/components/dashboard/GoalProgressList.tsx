'use client'

import Link from 'next/link'
import { ArrowRight, Target, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import type { Goal } from '@/types/database'

interface GoalProgressListProps {
  goals: Goal[]
  loading: boolean
}

export function GoalProgressList({ goals, loading }: GoalProgressListProps) {
  const activeGoals = goals.filter((g) => g.status === 'active')
  const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0)
  const totalTarget  = goals.reduce((s, g) => s + g.target_amount, 0)

  return (
    <div className="bg-app-surface rounded-2xl border border-app-border/40 flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-app-border/40">
        <div>
          <h2 className="text-base font-bold text-app-text">Metas de ahorro</h2>
          <p className="text-xs text-app-text-subtle mt-0.5">
            {loading
              ? '—'
              : `${activeGoals.length} activas · ${formatCurrency(totalCurrent)} / ${formatCurrency(totalTarget)}`}
          </p>
        </div>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 mt-0.5"
        >
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-app-border/30">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-28 bg-app-surface-alt" />
                <Skeleton className="h-3 w-8 bg-app-surface-alt" />
              </div>
              <Skeleton className="h-1.5 w-full bg-app-surface-alt rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 bg-app-surface-alt" />
                <Skeleton className="h-3 w-16 bg-app-surface-alt" />
              </div>
            </div>
          ))
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
            <Target className="h-7 w-7 text-app-text-subtle/40" strokeWidth={1.5} />
            <p className="text-sm text-app-text-subtle text-center">Sin metas de ahorro</p>
            <Link href="/goals" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              Crear primera meta →
            </Link>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const pct = goal.percentage ?? 0
            const color = goal.status === 'completed' ? '#10b981' : goal.color
            const isCompleted = goal.status === 'completed'

            return (
              <div key={goal.id} className="px-5 py-3 space-y-2">
                {/* Name row + percentage */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isCompleted && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-income shrink-0" aria-label="Meta completada" />
                    )}
                    <p className="text-sm font-semibold text-app-text truncate">{goal.name}</p>
                  </div>
                  <span
                    className="text-xs font-bold tabular-nums font-mono shrink-0"
                    style={{ color }}
                  >
                    {Math.round(Math.min(pct, 100))}%
                  </span>
                </div>

                {/* Linear progress bar */}
                <div className="h-1.5 w-full rounded-full overflow-hidden bg-app-surface-alt">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${Math.max(pct > 0 ? 2 : 0, Math.min(pct, 100))}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                {/* Amounts */}
                <div className="flex items-center justify-between tabular-nums">
                  <span className="text-sm font-bold font-mono" style={{ color }}>
                    {formatCurrency(goal.current_amount)}
                  </span>
                  <span className="text-xs text-app-text-subtle">de {formatCurrency(goal.target_amount)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
