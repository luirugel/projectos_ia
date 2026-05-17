'use client'

import { TrendingUp, TrendingDown, Minus, Wallet, PiggyBank } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import type { DashboardSummary } from '@/types/database'

interface SummaryCardsProps {
  summary: DashboardSummary | null
  loading: boolean
  periodLabel?: string
}

const SAVINGS_GOAL = 35

function splitAmount(value: number): { int: string; dec: string } {
  const [int, dec] = Math.abs(value).toFixed(2).split('.')
  return { int: Number(int).toLocaleString('es-EC'), dec }
}

function MomentumBadge({
  net, prevNet, hasPrev, periodLabel, dark,
}: { net: number; prevNet: number; hasPrev: boolean; periodLabel: string; dark?: boolean }) {
  if (!hasPrev) return null
  const deltaPct = ((net - prevNet) / Math.abs(prevNet || 1)) * 100
  const flat = Math.abs(deltaPct) < 0.05
  const up = deltaPct > 0
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown
  const sign = flat ? '' : up ? '+' : '−'

  const cls = dark
    ? flat
      ? 'bg-white/10 text-white/70'
      : up
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-red-500/20 text-red-300'
    : flat
    ? 'bg-app-surface-alt text-app-text-subtle'
    : up
    ? 'bg-income/10 text-income'
    : 'bg-expense/10 text-expense'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
      aria-label={`${sign}${Math.abs(deltaPct).toFixed(1)} por ciento respecto al ${periodLabel} anterior`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {sign}{Math.abs(deltaPct).toFixed(1)}%
    </span>
  )
}

function Sparkline({ data, color }: { data: Array<{ date: string; amount: number }>; color: string }) {
  if (!data?.length) return <div className="h-14" />
  const gradId = `spk-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="amount" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function SummaryCards({ summary, loading, periodLabel = 'período' }: SummaryCardsProps) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Hero skeleton */}
        <div className="sm:col-span-2 lg:col-span-1 rounded-3xl p-6 space-y-4"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', boxShadow: '0 8px 32px rgba(15,23,42,0.22), 0 2px 8px rgba(15,23,42,0.14)' }}>
          <Skeleton className="h-3 w-32 bg-white/10" />
          <Skeleton className="h-12 w-44 bg-white/10" />
          <Skeleton className="h-5 w-28 bg-white/10 rounded-full" />
          <Skeleton className="h-3 w-full bg-white/10" />
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-24 bg-white/10" />
            <Skeleton className="h-2 w-full bg-white/10 rounded-full" />
          </div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-app-border/40 bg-app-surface p-5 space-y-3"
            style={{ boxShadow: 'var(--app-shadow-md)' }}>
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20 bg-app-surface-alt" />
              <Skeleton className="h-8 w-8 rounded-full bg-app-surface-alt" />
            </div>
            <Skeleton className="h-9 w-32 bg-app-surface-alt" />
            <Skeleton className="h-3 w-20 bg-app-surface-alt" />
            <Skeleton className="h-14 w-full bg-app-surface-alt rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  const income = summary.total_income ?? 0
  const expenses = summary.total_expenses ?? 0
  const net = income - expenses
  const prevNet = (summary.prev_income ?? 0) - (summary.prev_expenses ?? 0)
  const hasPrev = (summary.prev_income ?? 0) > 0 || (summary.prev_expenses ?? 0) > 0
  const savingsRate = income > 0 ? (net / income) * 100 : null
  const negative = net < 0
  const { int: netInt, dec: netDec } = splitAmount(net)
  const { int: incInt, dec: incDec } = splitAmount(income)
  const { int: expInt, dec: expDec } = splitAmount(expenses)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* ── Hero: Net Balance — dark navy panel ── */}
      <div
        className="sm:col-span-2 lg:col-span-1 rounded-3xl p-6 flex flex-col gap-4"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '0 8px 32px rgba(15,23,42,0.22), 0 2px 8px rgba(15,23,42,0.14)',
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
            Balance del {periodLabel}
          </span>
          <MomentumBadge net={net} prevNet={prevNet} hasPrev={hasPrev} periodLabel={periodLabel} dark />
        </div>

        {/* Hero number */}
        <p
          className="flex items-baseline gap-0.5 leading-none"
          aria-label={`Balance del ${periodLabel}: ${negative ? 'menos ' : ''}${formatCurrency(Math.abs(net))}`}
        >
          {negative && <span className="text-2xl font-bold text-slate-300 mr-0.5">−</span>}
          <span className="text-slate-400 text-2xl font-semibold">$</span>
          <span className="text-[3rem] font-black tabular-nums tracking-tighter leading-none text-white">{netInt}</span>
          <span className="text-slate-400 text-2xl font-semibold">.{netDec}</span>
        </p>

        {/* Context sentence */}
        <p className="text-sm text-slate-400 leading-relaxed">
          {negative
            ? `Gastaste ${formatCurrency(expenses - income)} más de lo que ingresó este ${periodLabel}.`
            : income === 0
            ? `Registra ingresos para ver el resultado del ${periodLabel}.`
            : `Conservaste ${formatCurrency(net)} de ${formatCurrency(income)} ingresados.`}
        </p>

        {/* Savings rate */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <PiggyBank className="h-3 w-3 text-emerald-400" strokeWidth={2} />
              Tasa de ahorro
            </span>
            <span className={`text-sm font-bold tabular-nums ${
              savingsRate === null ? 'text-slate-500' : savingsRate >= SAVINGS_GOAL ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {savingsRate === null ? '—' : `${Math.max(savingsRate, 0).toFixed(1)}%`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                savingsRate !== null && savingsRate >= SAVINGS_GOAL ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(Math.max(savingsRate ?? 0, 0), 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {savingsRate === null
              ? 'Registra ingresos para calcularla.'
              : savingsRate >= SAVINGS_GOAL
              ? `Por encima de tu meta del ${SAVINGS_GOAL}%.`
              : `Meta personal: ${SAVINGS_GOAL}%.`}
          </p>
        </div>
      </div>

      {/* ── Income ── */}
      <div
        className="rounded-2xl bg-app-surface border border-app-border/40 p-5 flex flex-col gap-3"
        style={{ boxShadow: 'var(--app-shadow-md)' }}
      >
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-app-text-subtle">
            Ingresos
          </span>
          <div className="h-8 w-8 rounded-full bg-income/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-income" strokeWidth={2.5} />
          </div>
        </div>

        <p className="flex items-baseline gap-0.5 leading-none text-income">
          <span className="text-base font-bold opacity-50">$</span>
          <span className="text-4xl font-black tabular-nums tracking-tight">{incInt}</span>
          <span className="text-base font-bold opacity-50">.{incDec}</span>
        </p>

        {hasPrev ? (
          <p className="text-xs text-app-text-subtle tabular-nums">
            antes {formatCurrency(summary.prev_income ?? 0)}
          </p>
        ) : (
          <p className="text-xs text-app-text-subtle">este {periodLabel}</p>
        )}

        <div className="-mx-5 -mb-5 mt-auto">
          <Sparkline data={summary.daily_income ?? []} color="#10b981" />
        </div>
      </div>

      {/* ── Expenses ── */}
      <div
        className="rounded-2xl bg-app-surface border border-app-border/40 p-5 flex flex-col gap-3"
        style={{ boxShadow: 'var(--app-shadow-md)' }}
      >
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-app-text-subtle">
            Gastos
          </span>
          <div className="h-8 w-8 rounded-full bg-expense/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-4 w-4 text-expense" strokeWidth={2.5} />
          </div>
        </div>

        <p className="flex items-baseline gap-0.5 leading-none text-expense">
          <span className="text-base font-bold opacity-50">$</span>
          <span className="text-4xl font-black tabular-nums tracking-tight">{expInt}</span>
          <span className="text-base font-bold opacity-50">.{expDec}</span>
        </p>

        {hasPrev ? (
          <p className="text-xs text-app-text-subtle tabular-nums">
            antes {formatCurrency(summary.prev_expenses ?? 0)}
          </p>
        ) : (
          <p className="text-xs text-app-text-subtle">este {periodLabel}</p>
        )}

        <div className="-mx-5 -mb-5 mt-auto">
          <Sparkline data={summary.daily_expense ?? []} color="#ef4444" />
        </div>
      </div>
    </div>
  )
}
