'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { BudgetFormModal } from '@/components/budgets/BudgetFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { Skeleton } from '@/components/ui/skeleton'
import { useUIStore } from '@/lib/stores/uiStore'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { formatCurrency } from '@/lib/utils/currency'
import type { Budget } from '@/types/database'

const PERIOD_LABEL: Record<string, string> = {
  weekly:  'Semanal',
  monthly: 'Mensual',
  yearly:  'Anual',
}

type Status = 'ok' | 'warning' | 'over'

const STATUS: Record<Status, { bar: string; text: string; track: string; badge: string; label: string }> = {
  ok:      { bar: 'bg-income',      text: 'text-income',      track: 'bg-income/15',      badge: 'bg-income/10 text-income',           label: 'En control' },
  warning: { bar: 'bg-yellow-400',  text: 'text-yellow-500',  track: 'bg-yellow-400/15',  badge: 'bg-yellow-400/10 text-yellow-600 dark:text-yellow-400', label: 'Cerca del límite' },
  over:    { bar: 'bg-expense',     text: 'text-expense',     track: 'bg-expense/15',     badge: 'bg-expense/10 text-expense',          label: 'Excedido' },
}

function getStatus(pct: number): Status {
  if (pct >= 100) return 'over'
  if (pct >= 80)  return 'warning'
  return 'ok'
}

function BudgetRow({ budget, onEdit, onDelete }: { budget: Budget; onEdit: () => void; onDelete: () => void }) {
  const pct    = budget.percentage ?? 0
  const spent  = budget.spent ?? 0
  const avail  = budget.amount_limit - spent
  const status = getStatus(pct)
  const s      = STATUS[status]
  const fill   = Math.max(Math.min(pct, 100), pct > 0 ? 1 : 0)

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-app-surface-alt/50 transition-colors duration-150 group">
      {/* Icon */}
      <CategoryIcon icon={budget.category?.icon ?? 'tag'} color={budget.category?.color ?? '#6366f1'} size="sm" />

      {/* Name + period */}
      <div className="w-36 shrink-0 min-w-0">
        <p className="text-sm font-semibold text-app-text truncate">{budget.category?.name ?? 'Sin categoría'}</p>
        <p className="text-xs text-app-text-subtle">{PERIOD_LABEL[budget.period]}</p>
      </div>

      {/* Progress bar — takes remaining space */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className={`h-1.5 rounded-full overflow-hidden ${s.track}`}>
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${s.bar}`}
            style={{ width: `${fill}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-app-text-subtle tabular-nums">
            {formatCurrency(spent)} <span className="text-app-text-subtle/60">/ {formatCurrency(budget.amount_limit)}</span>
          </span>
          <span className={`text-xs tabular-nums font-semibold ${s.text}`}>
            {status === 'over'
              ? `+${formatCurrency(spent - budget.amount_limit)}`
              : formatCurrency(Math.max(avail, 0)) + ' libre'}
          </span>
        </div>
      </div>

      {/* Pct badge */}
      <span className={`shrink-0 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full w-14 text-center ${s.badge}`}>
        {pct.toFixed(0)}%
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit} aria-label="Editar presupuesto"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} aria-label="Eliminar presupuesto"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ label, count, badgeCls }: { label: string; count: number; badgeCls: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-b border-app-border/40 bg-app-surface-alt/40">
      <span className="text-xs font-bold uppercase tracking-widest text-app-text-subtle">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${badgeCls}`}>{count}</span>
    </div>
  )
}

export default function PresupuestosPage() {
  const { openBudgetModal, budgetModalOpen } = useUIStore()
  const { budgets, loading, deleteBudget, refresh } = useBudgets()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const prevBudgetModalOpen = useRef(false)

  useEffect(() => {
    if (prevBudgetModalOpen.current && !budgetModalOpen) refresh()
    prevBudgetModalOpen.current = budgetModalOpen
  }, [budgetModalOpen])

  async function handleDelete() {
    if (!deletingId) return
    await deleteBudget(deletingId)
    setConfirmOpen(false)
    setDeletingId(null)
  }

  const over    = budgets.filter((b) => (b.percentage ?? 0) >= 100)
  const warning = budgets.filter((b) => { const p = b.percentage ?? 0; return p >= 80 && p < 100 })
  const ok      = budgets.filter((b) => (b.percentage ?? 0) < 80)

  const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0)
  const totalLimit = budgets.reduce((s, b) => s + b.amount_limit, 0)
  const totalPct   = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-black text-app-text tracking-tight leading-tight">Presupuestos</h1>
          <span className="inline-flex items-center text-xs text-app-text-subtle bg-app-surface border border-app-border/40 px-2.5 py-1 rounded-full mt-2"
            style={{ boxShadow: 'var(--app-shadow-card)' }}>
            {loading ? '—' : `${budgets.length} activo${budgets.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <button
          onClick={() => openBudgetModal()}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 mt-1 shrink-0"
          style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* ── Summary bar ── */}
      {!loading && budgets.length > 0 && (
        <div
          className="bg-app-surface rounded-2xl border border-app-border/40 p-5 animate-fade-up"
          style={{ animationDelay: '60ms', boxShadow: 'var(--app-shadow-card)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-app-text-subtle">Gasto total del período</span>
            <span className={`text-sm font-black tabular-nums ${totalPct >= 100 ? 'text-expense' : totalPct >= 80 ? 'text-yellow-500' : 'text-app-text'}`}>
              {formatCurrency(totalSpent)}
              <span className="text-app-text-subtle font-normal"> / {formatCurrency(totalLimit)}</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-app-surface-alt overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${totalPct >= 100 ? 'bg-expense' : totalPct >= 80 ? 'bg-yellow-400' : 'bg-income'}`}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-app-text-subtle">{totalPct.toFixed(0)}% del total presupuestado</span>
            {over.length > 0 && (
              <span className="text-xs font-semibold text-expense">{over.length} excedido{over.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Budget list ── */}
      {loading ? (
        <div className="bg-app-surface rounded-2xl border border-app-border/40 overflow-hidden animate-fade-up"
          style={{ animationDelay: '120ms', boxShadow: 'var(--app-shadow-md)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-app-border/30 last:border-0">
              <Skeleton className="h-8 w-8 rounded-full bg-app-surface-alt shrink-0" />
              <div className="w-36 shrink-0 space-y-1.5">
                <Skeleton className="h-3.5 w-24 bg-app-surface-alt" />
                <Skeleton className="h-3 w-14 bg-app-surface-alt" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-1.5 w-full bg-app-surface-alt rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20 bg-app-surface-alt" />
                  <Skeleton className="h-3 w-16 bg-app-surface-alt" />
                </div>
              </div>
              <Skeleton className="h-6 w-14 rounded-full bg-app-surface-alt shrink-0" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div
          className="bg-app-surface rounded-2xl border border-app-border/40 flex flex-col items-center justify-center py-20 text-center animate-fade-up"
          style={{ animationDelay: '120ms', boxShadow: 'var(--app-shadow-md)' }}
        >
          <div className="h-16 w-16 rounded-2xl bg-app-surface-alt flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-app-text-subtle/60" strokeWidth={1.5} />
          </div>
          <p className="text-app-text font-bold text-lg">Sin presupuestos</p>
          <p className="text-app-text-subtle text-sm mt-1 mb-6 max-w-xs">
            Crea un presupuesto para controlar tus gastos por categoría
          </p>
          <button
            onClick={() => openBudgetModal()}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
          >
            <Plus className="h-4 w-4" /> Crear presupuesto
          </button>
        </div>
      ) : (
        <div
          className="bg-app-surface rounded-2xl border border-app-border/40 overflow-hidden animate-fade-up"
          style={{ animationDelay: '120ms', boxShadow: 'var(--app-shadow-md)' }}
        >
          {over.length > 0 && (
            <>
              <SectionHeader label="Excedidos" count={over.length} badgeCls="bg-expense/10 text-expense" />
              <div className="divide-y divide-app-border/30">
                {over.map((b) => (
                  <BudgetRow key={b.id} budget={b}
                    onEdit={() => openBudgetModal(b.id)}
                    onDelete={() => { setDeletingId(b.id); setConfirmOpen(true) }} />
                ))}
              </div>
            </>
          )}

          {warning.length > 0 && (
            <>
              <SectionHeader label="Cerca del límite" count={warning.length} badgeCls="bg-yellow-400/10 text-yellow-600 dark:text-yellow-400" />
              <div className="divide-y divide-app-border/30">
                {warning.map((b) => (
                  <BudgetRow key={b.id} budget={b}
                    onEdit={() => openBudgetModal(b.id)}
                    onDelete={() => { setDeletingId(b.id); setConfirmOpen(true) }} />
                ))}
              </div>
            </>
          )}

          {ok.length > 0 && (
            <>
              <SectionHeader label="En control" count={ok.length} badgeCls="bg-income/10 text-income" />
              <div className="divide-y divide-app-border/30">
                {ok.map((b) => (
                  <BudgetRow key={b.id} budget={b}
                    onEdit={() => openBudgetModal(b.id)}
                    onDelete={() => { setDeletingId(b.id); setConfirmOpen(true) }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <BudgetFormModal />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar presupuesto"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
      />
    </div>
  )
}
