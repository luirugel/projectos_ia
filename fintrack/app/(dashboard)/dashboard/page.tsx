'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Label,
} from 'recharts'
import { Plus, BarChart2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useDashboardSummary } from '@/lib/hooks/useDashboardSummary'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useGoals } from '@/lib/hooks/useGoals'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { BudgetProgressList } from '@/components/dashboard/BudgetProgressList'
import { GoalProgressList } from '@/components/dashboard/GoalProgressList'
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal'
import { useUIStore } from '@/lib/stores/uiStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatCurrency } from '@/lib/utils/currency'
import { getLast6Months, getCurrentMonthRange } from '@/lib/utils/dates'
import type { DashboardPeriod } from '@/types/database'

function fmtY(v: number): string {
  if (v === 0) return '$0'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`
  return `$${v.toFixed(0)}`
}

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'week',    label: 'Semana' },
  { key: 'month',   label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year',    label: 'Año' },
]

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

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
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

function greeting(): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function BarTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-app-surface border border-app-border/60 rounded-xl px-3 py-2.5 shadow-lg text-sm">
      <p className="text-app-text-subtle text-xs mb-2 capitalize font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-app-text-muted text-xs">{p.name === 'income' ? 'Ingresos' : 'Gastos'}:</span>
          <span className="text-app-text font-semibold tabular-nums font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-app-surface border border-app-border/60 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="text-app-text font-semibold">{item.name}</p>
      <p className="text-app-text-muted tabular-nums font-mono">{formatCurrency(item.value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { summary, loading: summaryLoading, periodType, setPeriodType, refresh } = useDashboardSummary()
  const { transactions, loading: txLoading, refresh: refreshTx } = useTransactions(getCurrentMonthRange())
  const { budgets, loading: budgetsLoading, refresh: refreshBudgets } = useBudgets()
  const { goals, loading: goalsLoading } = useGoals()
  const { openTransactionModal } = useUIStore()
  const [firstName, setFirstName] = useState<string>('')
  const [cashFlow, setCashFlow] = useState<Array<{ month: string; income: number; expenses: number }>>([])
  const [cashFlowLoading, setCashFlowLoading] = useState(true)
  const reducedMotion = useReducedMotion()
  const [chartsRef, chartsVisible] = useInView(0.1)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('full_name').single().then(({ data }) => {
      if (data?.full_name) setFirstName(data.full_name.split(' ')[0])
    })
  }, [])

  const fetchCashFlow = useCallback(async () => {
    setCashFlowLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCashFlowLoading(false); return }
    const months = getLast6Months()
    const results = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [{ data: inc }, { data: exp }] = await Promise.all([
          supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'income').gte('date', start).lte('date', end),
          supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').gte('date', start).lte('date', end),
        ])
        return {
          month: label,
          income: (inc ?? []).reduce((s, t) => s + Number(t.amount), 0),
          expenses: (exp ?? []).reduce((s, t) => s + Number(t.amount), 0),
        }
      })
    )
    setCashFlow(results)
    setCashFlowLoading(false)
  }, [])

  useEffect(() => { fetchCashFlow() }, [fetchCashFlow])

  const periodWord: Record<DashboardPeriod, string> = {
    week: 'semana', month: 'mes', quarter: 'trimestre', year: 'año',
  }

  const pieData = (summary?.by_category ?? [])
    .slice(0, 6)
    .map((c) => ({
      name: c.category.name,
      icon: c.category.icon,
      value: c.total,
      color: c.category.color,
      pct: c.percentage,
    }))

  const currentPeriodLabel = PERIODS.find((p) => p.key === periodType)?.label ?? 'Mes'

  return (
    <div className="space-y-5 pb-8 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-app-text tracking-tight">
          {greeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <div className="flex items-center gap-2">

          {/* Segmented period control */}
          <div
            role="tablist"
            aria-label="Período"
            className="relative flex items-center h-9 bg-app-surface-alt rounded-xl p-0.5 gap-0"
          >
            {/* Sliding indicator */}
            <span
              aria-hidden="true"
              className="segment-indicator absolute inset-y-0.5 rounded-[10px] bg-app-surface shadow-sm pointer-events-none"
              style={{
                left: `calc(${PERIODS.findIndex((p) => p.key === periodType) * 25}% + 2px)`,
                width: 'calc(25% - 4px)',
              }}
            />
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={periodType === key}
                onClick={() => setPeriodType(key)}
                className={`relative z-10 flex-1 h-8 px-2.5 rounded-[10px] text-xs font-semibold transition-colors duration-150 min-w-[52px] ${
                  periodType === key
                    ? 'text-app-text'
                    : 'text-app-text-subtle hover:text-app-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openTransactionModal()}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
            style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
            aria-label="Registrar nuevo movimiento"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* ── KPI stat row ── */}
      <SummaryCards summary={summary} loading={summaryLoading} periodLabel={periodWord[periodType]} />

      {/* ── Charts row (bar + donut) ── */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Cash-flow bar chart */}
        <div
          className={`lg:col-span-3 bg-app-surface rounded-2xl border border-app-border/40 shadow-sm overflow-hidden ${!reducedMotion ? 'transition-all duration-500 ease-out' : ''} ${!reducedMotion && !chartsVisible ? 'opacity-0 translate-y-4' : ''}`}
          style={!reducedMotion ? { transitionDelay: '0ms' } : undefined}
        >
          <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-app-border/40">
            <div>
              <h2 className="text-sm font-bold text-app-text">Flujo de caja</h2>
              <p className="text-xs text-app-text-subtle mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-app-text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-income shrink-0" />
                Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-expense/60 shrink-0" />
                Gastos
              </span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2">
            {cashFlowLoading ? (
              <Skeleton className="h-36 w-full bg-app-surface-alt rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={144}>
                <BarChart data={cashFlow} barGap={3} barCategoryGap="36%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border) / 0.3)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={fmtY} tickCount={4} domain={[0, 'auto']} width={44}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgb(var(--app-surface-alt) / 0.5)' }} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26}
                    isAnimationActive={!reducedMotion && chartsVisible}
                    animationDuration={500} animationEasing="ease-out" animationBegin={0} />
                  <Bar dataKey="expenses" fill="#ef444466" stroke="#ef4444" strokeWidth={1}
                    radius={[4, 4, 0, 0]} maxBarSize={26}
                    isAnimationActive={!reducedMotion && chartsVisible}
                    animationDuration={500} animationEasing="ease-out" animationBegin={120} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by category donut */}
        <div
          className={`lg:col-span-2 bg-app-surface rounded-2xl border border-app-border/40 shadow-sm overflow-hidden ${!reducedMotion ? 'transition-all duration-500 ease-out' : ''} ${!reducedMotion && !chartsVisible ? 'opacity-0 translate-y-4' : ''}`}
          style={!reducedMotion ? { transitionDelay: '80ms' } : undefined}
        >
          <div className="px-5 pt-4 pb-3 border-b border-app-border/40">
            <h2 className="text-sm font-bold text-app-text">Gastos por categoría</h2>
            <p className="text-xs text-app-text-subtle mt-0.5">{currentPeriodLabel} actual</p>
          </div>
          <div className="px-5 py-4">
            {summaryLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-48 w-full bg-app-surface-alt rounded-xl" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full bg-app-surface-alt shrink-0" />
                    <Skeleton className="h-3 flex-1 bg-app-surface-alt" />
                    <Skeleton className="h-3 w-14 bg-app-surface-alt" />
                  </div>
                ))}
              </div>
            ) : pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-app-surface-alt flex items-center justify-center">
                  <BarChart2 className="h-7 w-7 text-app-text-subtle/50" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-app-text-subtle">Sin gastos registrados</p>
                <p className="text-xs text-app-text-subtle/70">Registra un gasto para ver la distribución</p>
              </div>
            ) : (
              <>
                {/* Donut */}
                <ResponsiveContainer width="100%" height={192}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={56} outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                      isAnimationActive={!reducedMotion && chartsVisible}
                      animationDuration={650}
                      animationEasing="ease-out"
                      animationBegin={60}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.92} />
                      ))}
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          const vb = viewBox as { cx: number; cy: number }
                          const total = summary?.total_expenses ?? 0
                          return (
                            <g>
                              <text
                                x={vb.cx} y={vb.cy - 8}
                                textAnchor="middle"
                                style={{ fontSize: 15, fontWeight: 800, fill: 'rgb(var(--app-text))', fontFamily: 'ui-monospace, monospace' }}
                              >
                                {formatCurrency(total)}
                              </text>
                              <text
                                x={vb.cx} y={vb.cy + 10}
                                textAnchor="middle"
                                style={{ fontSize: 9, fill: 'rgb(var(--app-text-subtle))', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                              >
                                TOTAL GASTOS
                              </text>
                            </g>
                          )
                        }}
                      />
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category legend — staggered fade-in */}
                <div className="space-y-2 mt-1">
                  {pieData.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 ${!reducedMotion ? 'transition-all duration-300 ease-out' : ''} ${!reducedMotion && !chartsVisible ? 'opacity-0 -translate-x-2' : ''}`}
                      style={!reducedMotion ? { transitionDelay: `${200 + i * 40}ms` } : undefined}
                    >
                      <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                      <span className="text-xs text-app-text truncate flex-1">{item.name}</span>
                      <span className="text-xs tabular-nums font-mono font-semibold text-app-text shrink-0">
                        {item.pct.toFixed(0)}%
                      </span>
                      <span className="text-xs tabular-nums font-mono text-app-text-subtle shrink-0 w-20 text-right">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom grid: recent transactions + budgets & goals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} loading={txLoading} />
        </div>
        <div className="space-y-4">
          <BudgetProgressList budgets={budgets} loading={budgetsLoading} />
          <GoalProgressList goals={goals} loading={goalsLoading} />
        </div>
      </div>

      <TransactionFormModal
        recentSource={transactions}
        onSuccess={() => { refresh(); refreshTx(); refreshBudgets() }}
      />
    </div>
  )
}
