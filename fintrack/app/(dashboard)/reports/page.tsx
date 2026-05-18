'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer } from 'recharts'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { MonthlyBarChart } from '@/components/reports/MonthlyBarChart'
import { TrendLineChart } from '@/components/reports/TrendLineChart'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { useDashboardSummary } from '@/lib/hooks/useDashboardSummary'
import { formatCurrency } from '@/lib/utils/currency'
import { getLast6Months, getCurrentMonthRange, toISODate } from '@/lib/utils/dates'
import type { DashboardPeriod } from '@/types/database'

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'week',    label: 'Semana'    },
  { key: 'month',   label: 'Mes'       },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year',    label: 'Año'       },
]

interface MonthlyData { month: string; income: number; expenses: number }
interface DailyData   { date: string; amount: number }

function useReportsData() {
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [daily,   setDaily]   = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const months = getLast6Months()
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange()

    const [monthlyResults, dailyResult] = await Promise.all([
      Promise.all(months.map((m) =>
        Promise.all([
          supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'income').gte('date', m.start).lte('date', m.end),
          supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense').gte('date', m.start).lte('date', m.end),
        ])
      )),
      supabase.from('transactions').select('date, amount').eq('user_id', user.id).eq('type', 'expense').gte('date', monthStart).lte('date', monthEnd),
    ])

    setMonthly(months.map((m, i) => {
      const [inc, exp] = monthlyResults[i]
      return {
        month:    m.label,
        income:   (inc.data ?? []).reduce((s, t) => s + Number(t.amount), 0),
        expenses: (exp.data ?? []).reduce((s, t) => s + Number(t.amount), 0),
      }
    }))

    const dailyMap = new Map<string, number>()
    for (const tx of (dailyResult.data ?? [])) {
      const d = tx.date as string
      dailyMap.set(d, (dailyMap.get(d) ?? 0) + Number(tx.amount))
    }
    const days = eachDayOfInterval({ start: parseISO(monthStart), end: parseISO(monthEnd) })
    setDaily(days.map((d) => ({ date: format(d, 'd MMM', { locale: es }), amount: dailyMap.get(toISODate(d)) ?? 0 })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  return { monthly, daily, loading }
}

function PieTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-app-surface border border-app-border/40 rounded-xl px-3 py-2 text-sm"
      style={{ boxShadow: 'var(--app-shadow-md)' }}>
      <p className="text-app-text font-semibold">{item.name}</p>
      <p className="text-app-text-subtle">{formatCurrency(item.value)}</p>
    </div>
  )
}

export default function ReportesPage() {
  const { summary, loading: summaryLoading, periodType, setPeriodType } = useDashboardSummary()
  const { monthly, daily, loading: chartsLoading } = useReportsData()

  const isLoading     = summaryLoading || chartsLoading
  const totalIncome   = summary?.total_income   ?? 0
  const totalExpenses = summary?.total_expenses  ?? 0
  const netBalance    = totalIncome - totalExpenses

  const pieData = (summary?.by_category ?? []).map((bc) => ({
    name:  bc.category.name,
    icon:  bc.category.icon,
    value: bc.total,
    color: bc.category.color,
    pct:   bc.percentage,
    count: bc.transaction_count,
  }))

  const periodLabel = PERIODS.find((p) => p.key === periodType)?.label ?? 'Mes'

  const summaryCards = [
    { label: `Ingresos — ${periodLabel}`, value: totalIncome,   icon: TrendingUp,   color: '#10b981', bg: 'bg-income/10' },
    { label: `Gastos — ${periodLabel}`,   value: totalExpenses, icon: TrendingDown, color: '#ef4444', bg: 'bg-expense/10' },
    {
      label: 'Balance neto',
      value: netBalance,
      icon: Wallet,
      color: netBalance >= 0 ? '#3b82f6' : '#ef4444',
      bg: netBalance >= 0 ? 'bg-primary/10' : 'bg-expense/10',
    },
  ]

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-3xl font-black text-app-text tracking-tight leading-tight">Reportes</h1>
          <p className="text-xs text-app-text-subtle mt-1.5">Análisis de tus finanzas personales</p>
        </div>
        {/* Period selector — matches dashboard style */}
        <div
          className="flex items-center bg-app-surface-alt rounded-xl p-1 gap-0.5 self-start sm:self-auto border border-app-border/40"
          style={{ boxShadow: 'var(--app-shadow-card)' }}
        >
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriodType(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                periodType === key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-app-text-subtle hover:text-app-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-app-surface border border-app-border/40 rounded-2xl p-5 relative overflow-hidden"
            style={{ boxShadow: 'var(--app-shadow-card)' }}
          >
            {/* Icon badge — top right */}
            <div className={`absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center ${bg}`}>
              <Icon className="h-5 w-5" strokeWidth={1.75} style={{ color }} />
            </div>
            <p className="text-xs font-semibold text-app-text-subtle mb-2 pr-12">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-28 bg-app-surface-alt" />
            ) : (
              <p className="text-2xl font-black tabular-nums" style={{ color }}>{formatCurrency(value)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-up" style={{ animationDelay: '120ms' }}>

        {/* Donut — Gastos por categoría */}
        <div
          className="lg:col-span-2 bg-app-surface border border-app-border/40 rounded-2xl p-5 flex flex-col"
          style={{ boxShadow: 'var(--app-shadow-md)' }}
        >
          <div className="mb-4">
            <h2 className="text-base font-bold text-app-text">Gastos por categoría</h2>
            <p className="text-xs text-app-text-subtle mt-0.5 capitalize">{periodLabel} actual</p>
          </div>
          {summaryLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-44 w-full bg-app-surface-alt rounded-xl" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full bg-app-surface-alt shrink-0" />
                  <Skeleton className="h-3 flex-1 bg-app-surface-alt" />
                  <Skeleton className="h-3 w-20 bg-app-surface-alt" />
                </div>
              ))}
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-app-text-subtle text-sm">
              Sin gastos registrados
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={82}
                    paddingAngle={3} dataKey="value"
                    stroke="none" cornerRadius={6}
                    isAnimationActive animationDuration={700} animationEasing="ease-out"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        const vb = viewBox as { cx: number; cy: number }
                        return (
                          <g>
                            <text x={vb.cx} y={vb.cy - 9} textAnchor="middle"
                              style={{ fontSize: 16, fontWeight: 800, fill: 'rgb(var(--app-text))', letterSpacing: '-0.5px' }}>
                              {formatCurrency(totalExpenses)}
                            </text>
                            <text x={vb.cx} y={vb.cy + 9} textAnchor="middle"
                              style={{ fontSize: 9.5, fill: 'rgb(var(--app-text-subtle))', letterSpacing: '0.5px' }}>
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
              <div className="space-y-2 mt-1">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CategoryIcon icon={item.icon} color={item.color} size="xs" />
                    <span className="flex-1 text-xs font-semibold text-app-text truncate">{item.name}</span>
                    <span className="text-xs text-app-text-subtle tabular-nums shrink-0">{item.count} tx</span>
                    <span className="text-xs text-app-text-subtle tabular-nums w-8 text-right shrink-0">{item.pct.toFixed(0)}%</span>
                    <span className="text-xs font-bold tabular-nums w-16 text-right shrink-0" style={{ color: item.color }}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar chart — Ingresos vs Gastos */}
        <div
          className="lg:col-span-3 bg-app-surface border border-app-border/40 rounded-2xl p-5"
          style={{ boxShadow: 'var(--app-shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-app-text">Ingresos vs Gastos</h2>
              <p className="text-xs text-app-text-subtle mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-app-text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-income inline-block" />Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-expense/40 inline-block" />Gastos
              </span>
            </div>
          </div>
          {chartsLoading ? (
            <Skeleton className="h-[260px] w-full bg-app-surface-alt rounded-xl" />
          ) : (
            <MonthlyBarChart data={monthly} />
          )}
        </div>
      </div>

      {/* Trend line */}
      <div
        className="bg-app-surface border border-app-border/40 rounded-2xl p-5 animate-fade-up"
        style={{ animationDelay: '180ms', boxShadow: 'var(--app-shadow-md)' }}
      >
        <div className="mb-4">
          <h2 className="text-base font-bold text-app-text">Tendencia de gastos diarios</h2>
          <p className="text-xs text-app-text-subtle mt-0.5">Este mes</p>
        </div>
        {chartsLoading ? (
          <Skeleton className="h-[260px] w-full bg-app-surface-alt rounded-xl" />
        ) : (
          <TrendLineChart data={daily} />
        )}
      </div>

    </div>
  )
}
