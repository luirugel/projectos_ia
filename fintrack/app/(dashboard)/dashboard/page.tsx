'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts'
import { Plus } from 'lucide-react'
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
import { MomentumStreak } from '@/components/dashboard/MomentumStreak'
import { ActivationCard } from '@/components/dashboard/ActivationCard'
import { useNavCounts } from '@/lib/hooks/useNavCounts'
import { useUIStore } from '@/lib/stores/uiStore'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateLong, getLast6Months, getCurrentMonthRange } from '@/lib/utils/dates'
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

function greeting(): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'Buenos días'
  if (h >= 12 && h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-app-surface border border-app-border/60 rounded-lg px-3 py-2.5 shadow-lg text-sm">
      <p className="text-app-text-subtle text-xs mb-2 capitalize font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-app-text-muted">{p.name === 'income' ? 'Ingresos' : 'Gastos'}:</span>
          <span className="text-app-text font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-app-surface border border-app-border/60 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-app-text font-semibold">{item.name}</p>
      <p className="text-app-text-muted tabular-nums">{formatCurrency(item.value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { summary, loading: summaryLoading, periodType, setPeriodType, refresh } = useDashboardSummary()
  const { transactions, loading: txLoading, refresh: refreshTx } = useTransactions(getCurrentMonthRange())
  const { budgets, loading: budgetsLoading, refresh: refreshBudgets } = useBudgets()
  const { goals, loading: goalsLoading } = useGoals()
  const { accounts: accountCount, transactions: txCount, goals: goalCount, loading: countsLoading, refresh: refreshCounts } = useNavCounts()
  const { openTransactionModal } = useUIStore()
  const [firstName, setFirstName] = useState<string>('')
  const [cashFlow, setCashFlow] = useState<Array<{ month: string; income: number; expenses: number }>>([])
  const [cashFlowLoading, setCashFlowLoading] = useState(true)

  const today = formatDateLong(new Date().toISOString().split('T')[0])

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

  const periodWord: Record<DashboardPeriod, string> = { week: 'semana', month: 'mes', quarter: 'trimestre', year: 'año' }

  const pieData = (summary?.by_category ?? [])
    .slice(0, 6)
    .map((c) => ({ name: c.category.name, icon: c.category.icon, value: c.total, color: c.category.color, pct: c.percentage }))

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-black text-app-text tracking-tight leading-tight">
            {greeting()}{firstName ? `, ${firstName}.` : '.'}
          </h1>
          <span className="inline-flex items-center text-xs text-app-text-subtle bg-app-surface border border-app-border/40 px-2.5 py-1 rounded-full mt-2 capitalize"
            style={{ boxShadow: 'var(--app-shadow-card)' }}>
            {today}
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period selector */}
          <div className="flex items-center bg-app-surface border border-app-border/40 rounded-xl p-1 gap-0.5"
            style={{ boxShadow: 'var(--app-shadow-card)' }}>
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriodType(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                  periodType === key
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Primary CTA */}
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

      {/* ── Habit engine ── */}
      {!countsLoading && (
        accountCount > 0 && txCount > 0 ? (
          <MomentumStreak />
        ) : (
          <ActivationCard
            accounts={accountCount}
            transactions={txCount}
            goals={goalCount}
            onLogTransaction={() => openTransactionModal()}
          />
        )
      )}

      {/* ── Summary cards ── */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <SummaryCards summary={summary} loading={summaryLoading} periodLabel={periodWord[periodType]} />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-up" style={{ animationDelay: '120ms' }}>

        {/* Cash flow bar chart */}
        <div
          className="lg:col-span-3 bg-app-surface rounded-2xl border border-app-border/40 overflow-hidden"
          style={{ boxShadow: 'var(--app-shadow-md)' }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-app-border/40">
            <div>
              <h2 className="text-base font-bold text-app-text">Flujo de caja</h2>
              <p className="text-xs text-app-text-subtle mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-app-text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-income inline-block shrink-0" />
                Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm inline-block shrink-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg,#ef444488,#ef444488 2px,transparent 2px,transparent 6px)',
                    border: '1px solid #ef4444',
                  }}
                />
                Gastos
              </span>
            </div>
          </div>
          <div className="px-4 py-5">
            {cashFlowLoading ? (
              <Skeleton className="h-56 w-full bg-app-surface-alt rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={cashFlow} barGap={4} barCategoryGap="38%">
                  <defs>
                    <pattern id="expenseHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                      <rect width="6" height="6" fill="#ef4444" />
                      <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.55)" strokeWidth="3" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border) / 0.35)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgb(var(--app-text-subtle))', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtY} tickCount={5} domain={[0, 'auto']} width={52} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgb(var(--app-surface-alt) / 0.4)' }} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30}
                    isAnimationActive animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="expenses" fill="url(#expenseHatch)" stroke="#ef4444" strokeWidth={1}
                    radius={[4, 4, 0, 0]} maxBarSize={30}
                    isAnimationActive animationDuration={700} animationEasing="ease-out" animationBegin={120} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category donut */}
        <div
          className="lg:col-span-2 bg-app-surface rounded-2xl border border-app-border/40 overflow-hidden"
          style={{ boxShadow: 'var(--app-shadow-md)' }}
        >
          <div className="px-5 pt-5 pb-3 border-b border-app-border/40">
            <h2 className="text-base font-bold text-app-text">Gasto por categoría</h2>
            <p className="text-xs text-app-text-subtle mt-0.5 capitalize">
              {PERIODS.find((p) => p.key === periodType)?.label ?? 'Mes'} actual
            </p>
          </div>

          <div className="px-5 py-4">
            {summaryLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-44 w-full bg-app-surface-alt rounded-xl" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full bg-app-surface-alt shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <Skeleton className="h-3 w-24 bg-app-surface-alt" />
                        <Skeleton className="h-3 w-14 bg-app-surface-alt" />
                      </div>
                      <Skeleton className="h-1 w-full bg-app-surface-alt rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pieData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-app-text-subtle text-sm">
                Sin gastos registrados
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={172}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={5}
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 2px 6px ${entry.color}44)` }} />
                      ))}
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          const vb = viewBox as { cx: number; cy: number }
                          const total = summary?.total_expenses ?? 0
                          return (
                            <g>
                              <text x={vb.cx} y={vb.cy - 8} textAnchor="middle"
                                style={{ fontSize: 15, fontWeight: 800, fill: 'rgb(var(--app-text))', letterSpacing: '-0.5px' }}>
                                {formatCurrency(total)}
                              </text>
                              <text x={vb.cx} y={vb.cy + 9} textAnchor="middle"
                                style={{ fontSize: 9, fill: 'rgb(var(--app-text-subtle))', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
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

                {/* Legend — 2-line row per category */}
                <div className="space-y-3 mt-3">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CategoryIcon icon={item.icon} color={item.color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-app-text truncate">{item.name}</span>
                          <span className="text-xs font-bold tabular-nums text-app-text shrink-0">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-app-surface-alt">
                          <div
                            className="h-full rounded-full transition-[width] duration-700 ease-out"
                            style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom 3-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <RecentTransactions transactions={transactions} loading={txLoading} />
        <BudgetProgressList budgets={budgets} loading={budgetsLoading} />
        <GoalProgressList goals={goals} loading={goalsLoading} />
      </div>

      <TransactionFormModal
        recentSource={transactions}
        onSuccess={() => { refresh(); refreshTx(); refreshBudgets(); refreshCounts() }}
      />
    </div>
  )
}
