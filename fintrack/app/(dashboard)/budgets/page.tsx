'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BudgetFormModal } from '@/components/budgets/BudgetFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { useUIStore } from '@/lib/stores/uiStore'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { formatCurrency } from '@/lib/utils/currency'
import type { Budget } from '@/types/database'

const PERIOD_LABEL: Record<string, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const STATUS_STYLES = {
  ok:      { border: 'border-income/30',   track: 'bg-income/15',   fill: 'bg-income',    text: 'text-income',    label: 'text-app-text-muted' },
  warning: { border: 'border-yellow-400/40', track: 'bg-yellow-400/15', fill: 'bg-yellow-400', text: 'text-yellow-400', label: 'text-yellow-400 font-medium' },
  over:    { border: 'border-expense/40',  track: 'bg-expense/15',  fill: 'bg-expense',   text: 'text-expense',   label: 'text-expense font-medium' },
}

function BudgetCard({ budget, onEdit, onDelete }: { budget: Budget; onEdit: () => void; onDelete: () => void }) {
  const pct = budget.percentage ?? 0
  const spent = budget.spent ?? 0
  const status = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
  const styles = STATUS_STYLES[status]

  return (
    <div className={`bg-app-surface border rounded-xl p-4 hover:border-opacity-80 transition-colors group ${styles.border}`}>
      {/* Colored top accent bar */}
      <div className={`h-1 -mx-4 -mt-4 mb-4 rounded-t-xl ${styles.fill} opacity-70`} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <CategoryIcon icon={budget.category?.icon ?? 'tag'} color={budget.category?.color ?? '#6366f1'} size="md" />
          <div>
            <p className="font-medium text-app-text">{budget.category?.name ?? 'Sin categoría'}</p>
            <Badge variant="secondary" className="text-xs mt-0.5 bg-app-surface-alt text-app-text-subtle border-0">
              {PERIOD_LABEL[budget.period]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button onClick={onEdit} aria-label="Editar presupuesto" className="p-1.5 rounded-md text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} aria-label="Eliminar presupuesto" className="p-1.5 rounded-md text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={styles.label}>{formatCurrency(spent)}</span>
          <span className="text-app-text-subtle">de {formatCurrency(budget.amount_limit)}</span>
        </div>

        {/* Progress bar: colored track + colored fill */}
        <div className={`relative h-2.5 rounded-full overflow-hidden ${styles.track}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.fill}`}
            style={{ width: `${Math.max(Math.min(pct, 100), pct > 0 ? 2 : 0)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className={`font-semibold ${styles.text}`}>{pct.toFixed(0)}%</span>
          <span className="text-app-text-subtle">
            {status === 'over'
              ? `Excedido por ${formatCurrency(spent - budget.amount_limit)}`
              : `Disponible: ${formatCurrency(budget.amount_limit - spent)}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PresupuestosPage() {
  const { openBudgetModal, budgetModalOpen } = useUIStore()
  const { budgets, loading: isLoading, deleteBudget, refresh } = useBudgets()
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

  const overBudget = budgets.filter((b) => (b.percentage ?? 0) >= 100)
  const warningBudget = budgets.filter((b) => { const p = b.percentage ?? 0; return p >= 80 && p < 100 })
  const okBudget = budgets.filter((b) => (b.percentage ?? 0) < 80)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Presupuestos</h1>
          <p className="text-sm text-app-text-subtle mt-0.5">{budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''} activo{budgets.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => openBudgetModal()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo presupuesto</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-app-surface border border-app-border/60 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-app-surface-alt rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-app-surface-alt rounded" />
                  <div className="h-3 w-16 bg-app-surface-alt rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-app-surface-alt rounded" />
                <div className="h-2 w-full bg-app-surface-alt rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="h-12 w-12 text-app-text-subtle mb-4" />
          <p className="text-app-text font-medium text-lg">Sin presupuestos</p>
          <p className="text-app-text-subtle text-sm mt-1 mb-4">Crea un presupuesto para controlar tus gastos por categoría</p>
          <Button onClick={() => openBudgetModal()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="h-4 w-4" /> Crear presupuesto
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {overBudget.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-expense mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-expense rounded-full" /> Excedidos ({overBudget.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group">
                {overBudget.map((b) => (
                  <BudgetCard key={b.id} budget={b}
                    onEdit={() => openBudgetModal(b.id)}
                    onDelete={() => { setDeletingId(b.id); setConfirmOpen(true) }} />
                ))}
              </div>
            </div>
          )}
          {warningBudget.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full" /> Cerca del límite ({warningBudget.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group">
                {warningBudget.map((b) => (
                  <BudgetCard key={b.id} budget={b}
                    onEdit={() => openBudgetModal(b.id)}
                    onDelete={() => { setDeletingId(b.id); setConfirmOpen(true) }} />
                ))}
              </div>
            </div>
          )}
          {okBudget.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-app-text-subtle uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-income rounded-full" /> En control ({okBudget.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group">
                {okBudget.map((b) => (
                  <BudgetCard key={b.id} budget={b}
                    onEdit={() => openBudgetModal(b.id)}
                    onDelete={() => { setDeletingId(b.id); setConfirmOpen(true) }} />
                ))}
              </div>
            </div>
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
