'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
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

// ── Icon badge ────────────────────────────────────────────────────────────────

type IconVariant = 'income' | 'expense' | 'primary' | 'savings'

const VARIANT_CLS: Record<IconVariant, { bg: string; icon: string; ring: string }> = {
  income:  { bg: 'bg-income/10',      icon: 'text-income',    ring: 'rgba(16,185,129,0.25)' },
  expense: { bg: 'bg-expense/10',     icon: 'text-expense',   ring: 'rgba(239,68,68,0.25)' },
  primary: { bg: 'bg-primary/10',     icon: 'text-primary',   ring: 'rgba(59,130,246,0.25)' },
  savings: { bg: 'bg-amber-500/10',   icon: 'text-amber-500', ring: 'rgba(245,158,11,0.25)' },
}

function StatIcon({
  icon: Icon,
  variant,
  size = 'md',
  animKey,
  delay = 0,
}: {
  icon: LucideIcon
  variant: IconVariant
  size?: 'sm' | 'md'
  animKey?: string | number
  delay?: number
}) {
  const { bg, icon: iconCls } = VARIANT_CLS[variant]
  const containerCls = size === 'md'
    ? 'h-9 w-9 rounded-xl'
    : 'h-8 w-8 rounded-lg'
  const iconCss = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <span
      key={animKey}
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 ${containerCls} ${bg} animate-icon-pop group-hover:scale-110 transition-transform duration-200 ease-out`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <Icon className={`${iconCss} ${iconCls}`} strokeWidth={2} />
    </span>
  )
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: Array<{ date: string; amount: number }>; color: string }) {
  if (!data?.length) return <div className="h-12" />
  const gradId = `spk-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="amount"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  if (!prev) return null
  const pct = ((current - prev) / Math.abs(prev)) * 100
  const flat = Math.abs(pct) < 0.5
  const up = pct > 0
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  const cls = flat
    ? 'text-app-text-subtle bg-app-surface-alt'
    : up
    ? 'text-income bg-income/10'
    : 'text-expense bg-expense/10'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {flat ? '—' : `${Math.abs(pct).toFixed(1)}%`}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SummaryCards({ summary, loading, periodLabel = 'período' }: SummaryCardsProps) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Hero skeleton */}
        <div className="col-span-2 bg-app-surface border border-app-border/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-xl bg-app-surface-alt" />
            <Skeleton className="h-3 w-24 bg-app-surface-alt" />
          </div>
          <Skeleton className="h-10 w-40 bg-app-surface-alt" />
          <Skeleton className="h-3 w-full bg-app-surface-alt" />
          <Skeleton className="h-3 w-28 bg-app-surface-alt" />
        </div>
        {/* Secondary skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-span-1 bg-app-surface border border-app-border/40 rounded-2xl p-4 space-y-2.5">
            <Skeleton className="h-9 w-9 rounded-xl bg-app-surface-alt" />
            <Skeleton className="h-3 w-16 bg-app-surface-alt" />
            <Skeleton className="h-7 w-24 bg-app-surface-alt" />
            <Skeleton className="h-10 w-full bg-app-surface-alt rounded-lg mt-2" />
          </div>
        ))}
      </div>
    )
  }

  const income   = summary.total_income ?? 0
  const expenses = summary.total_expenses ?? 0
  const net      = income - expenses
  const negative = net < 0
  const savingsRate = income > 0 ? Math.max((net / income) * 100, 0) : null
  const hasPrev  = (summary.prev_income ?? 0) > 0 || (summary.prev_expenses ?? 0) > 0
  const prevNet  = (summary.prev_income ?? 0) - (summary.prev_expenses ?? 0)

  // animKey: changes when data loads so icons retrigger their pop animation
  const animKey = `loaded-${income}-${expenses}`

  const heroBg = negative
    ? 'bg-expense/[0.04] border-expense/20'
    : net > 0
    ? 'bg-primary/[0.04] border-primary/20'
    : 'bg-app-surface border-app-border/40'

  const heroNumColor = negative ? 'text-expense' : 'text-app-text'

  const contextSentence = negative
    ? `Gastaste ${formatCurrency(expenses - income)} más de lo que ingresaste.`
    : income === 0
    ? `Registra ingresos para ver tu balance del ${periodLabel}.`
    : `Conservaste ${formatCurrency(net)} de ${formatCurrency(income)} ingresados.`

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

      {/* ── Hero: Balance ── */}
      <div className={`col-span-2 group rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${heroBg}`}>
        <div>
          {/* Icon + label row */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <StatIcon
                icon={Wallet}
                variant="primary"
                size="md"
                animKey={animKey}
                delay={0}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle">
                Balance del {periodLabel}
              </span>
            </div>
            {hasPrev && <DeltaBadge current={net} prev={prevNet} />}
          </div>

          <p
            className={`text-4xl lg:text-5xl font-black tabular-nums font-mono leading-none tracking-tight ${heroNumColor}`}
            aria-label={`Balance: ${negative ? 'menos ' : ''}${formatCurrency(Math.abs(net))}`}
          >
            {negative ? '−' : ''}{formatCurrency(Math.abs(net))}
          </p>

          <p className="text-sm text-app-text-subtle mt-3 leading-snug">
            {contextSentence}
          </p>
        </div>

        {summary.ytd_balance !== undefined && (
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-app-border/30">
            <span className="text-xs text-app-text-subtle uppercase tracking-wide font-semibold">YTD</span>
            <span className={`text-sm font-bold tabular-nums font-mono ${summary.ytd_balance < 0 ? 'text-expense' : 'text-app-text'}`}>
              {summary.ytd_balance < 0 ? '−' : ''}{formatCurrency(Math.abs(summary.ytd_balance))}
            </span>
          </div>
        )}
      </div>

      {/* ── Income ── */}
      <div className="col-span-1 group bg-app-surface rounded-2xl border border-app-border/40 shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-0 flex-1">
          {/* Icon row */}
          <div className="flex items-start justify-between mb-3">
            <StatIcon
              icon={TrendingUp}
              variant="income"
              size="md"
              animKey={animKey}
              delay={60}
            />
            {hasPrev && <DeltaBadge current={income} prev={summary.prev_income ?? 0} />}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle mb-1.5">
            Ingresos
          </p>

          <p className="text-2xl font-bold tabular-nums font-mono leading-none text-income">
            {formatCurrency(income)}
          </p>

          <p className="text-xs text-app-text-subtle mt-1.5 tabular-nums">
            {hasPrev ? `antes ${formatCurrency(summary.prev_income ?? 0)}` : `este ${periodLabel}`}
          </p>
        </div>

        {/* Sparkline flush to card bottom */}
        <div className="mt-2 -mx-px">
          <Sparkline data={summary.daily_income ?? []} color="#10b981" />
        </div>
      </div>

      {/* ── Expenses ── */}
      <div className="col-span-1 group bg-app-surface rounded-2xl border border-app-border/40 shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-0 flex-1">
          {/* Icon row */}
          <div className="flex items-start justify-between mb-3">
            <StatIcon
              icon={TrendingDown}
              variant="expense"
              size="md"
              animKey={animKey}
              delay={120}
            />
            {hasPrev && <DeltaBadge current={expenses} prev={summary.prev_expenses ?? 0} />}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle mb-1.5">
            Gastos
          </p>

          <p className="text-2xl font-bold tabular-nums font-mono leading-none text-expense">
            {formatCurrency(expenses)}
          </p>

          <p className="text-xs text-app-text-subtle mt-1.5 tabular-nums">
            {hasPrev ? `antes ${formatCurrency(summary.prev_expenses ?? 0)}` : `este ${periodLabel}`}
          </p>
        </div>

        <div className="mt-2 -mx-px">
          <Sparkline data={summary.daily_expense ?? []} color="#ef4444" />
        </div>
      </div>

      {/* ── Savings Rate ── */}
      <div className="col-span-2 lg:col-span-1 group bg-app-surface rounded-2xl border border-app-border/40 shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Icon row */}
            <div className="mb-3">
              <StatIcon
                icon={PiggyBank}
                variant="savings"
                size="md"
                animKey={animKey}
                delay={180}
              />
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-app-text-subtle mb-1.5">
              Tasa de ahorro
            </p>

            <p className={`text-2xl font-bold tabular-nums font-mono leading-none ${
              savingsRate !== null && savingsRate >= SAVINGS_GOAL ? 'text-income' : 'text-app-text'
            }`}>
              {savingsRate === null ? '—' : `${savingsRate.toFixed(1)}%`}
            </p>

            <p className="text-xs text-app-text-subtle mt-1.5">
              {savingsRate === null
                ? 'Registra ingresos'
                : savingsRate >= SAVINGS_GOAL
                ? `Meta del ${SAVINGS_GOAL}% alcanzada`
                : `Meta: ${SAVINGS_GOAL}%`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-app-text-subtle/70 font-medium">0%</span>
              <span className="text-[10px] text-app-text-subtle/70 font-medium">{SAVINGS_GOAL}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-app-surface-alt overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                  savingsRate !== null && savingsRate >= SAVINGS_GOAL ? 'bg-income' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(savingsRate ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
