'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Target, CheckCircle2, PauseCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GoalFormModal } from '@/components/goals/GoalFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { GlossyIcon } from '@/components/shared/GlossyIcon'
import { useUIStore } from '@/lib/stores/uiStore'
import { useGoals } from '@/lib/hooks/useGoals'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { goalContributionSchema, type GoalContributionFormValues } from '@/lib/validations/goal'
import type { Goal } from '@/types/database'

const STATUS_CONFIG = {
  active:    { label: 'Activa',      color: '#3b82f6' },
  completed: { label: 'Completada',  color: '#10b981' },
  paused:    { label: 'Pausada',     color: '#94a3b8' },
}

function GoalCard({
  goal, onEdit, onDelete, onContribute,
}: {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
  onContribute: () => void
}) {
  const pct = Math.min(goal.percentage ?? 0, 100)
  const cfg = STATUS_CONFIG[goal.status]
  const remaining = goal.target_amount - goal.current_amount

  return (
    <Card className="border-app-border/60 bg-app-surface hover:border-app-border transition-colors group">
      <CardContent className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <CategoryIcon icon={goal.icon ?? 'target'} color={goal.color} size="md" />
            <div>
              <p className="font-semibold text-app-text leading-tight">{goal.name}</p>
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button onClick={onEdit} aria-label="Editar meta" className="p-1.5 rounded-md text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} aria-label="Eliminar meta" className="p-1.5 rounded-md text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {goal.description && (
          <p className="text-xs text-app-text-subtle mb-3 line-clamp-2">{goal.description}</p>
        )}

        {/* Amounts */}
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-xl font-bold tabular-nums text-app-text">{formatCurrency(goal.current_amount)}</span>
          <span className="text-xs text-app-text-subtle">de {formatCurrency(goal.target_amount)}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: `${goal.color}20` }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: goal.color }}
          />
        </div>

        {/* Stats row */}
        <div className="flex justify-between text-xs mb-4">
          <span className="font-semibold tabular-nums" style={{ color: goal.color }}>{pct.toFixed(0)}%</span>
          <span className="text-app-text-subtle">
            {goal.status === 'completed'
              ? 'Meta alcanzada'
              : goal.target_date
              ? goal.days_remaining !== undefined && goal.days_remaining > 0
                ? `${goal.days_remaining} días restantes`
                : goal.days_remaining === 0
                ? 'Vence hoy'
                : 'Vencida'
              : remaining > 0
              ? `Falta ${formatCurrency(remaining)}`
              : 'Meta alcanzada'}
          </span>
        </div>

        {goal.status === 'active' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full border-app-border text-app-text-muted hover:bg-app-surface-alt hover:text-app-text text-xs gap-1"
            onClick={onContribute}
          >
            <Plus className="h-3 w-3" /> Agregar aporte
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ContributionModal({ goal, open, onOpenChange }: { goal: Goal | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addContribution } = useGoals()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GoalContributionFormValues>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  async function onSubmit(values: GoalContributionFormValues) {
    if (!goal) return
    const result = await addContribution(goal.id, values)
    if (!result.error) { reset(); onOpenChange(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-app-text">Agregar aporte</DialogTitle>
        </DialogHeader>
        {goal && (
          <div className="flex items-center gap-3 mb-2 p-3 rounded-lg bg-app-surface-alt border border-app-border/60">
            <CategoryIcon icon={goal.icon ?? 'target'} color={goal.color} size="sm" />
            <div>
              <p className="text-sm font-medium text-app-text">{goal.name}</p>
              <p className="text-xs text-app-text-subtle">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-app-text-muted">Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-subtle">$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                className="no-spinner pl-7 border-app-border bg-app-surface-alt text-app-text"
              />
            </div>
            {errors.amount && <p className="text-xs text-expense">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-app-text-muted">Fecha *</Label>
            <Input
              type="date"
              {...register('date')}
              className="border-app-border bg-app-surface-alt text-app-text"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-app-text-muted">Nota</Label>
            <Input
              placeholder="Nota opcional..."
              {...register('note')}
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 border-app-border text-app-text-muted hover:bg-app-surface-alt" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function MetasPage() {
  const { openGoalModal, goalModalOpen } = useUIStore()
  const { goals, loading: isLoading, deleteGoal, refresh } = useGoals()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)
  const prevGoalModalOpen = useRef(false)

  useEffect(() => {
    if (prevGoalModalOpen.current && !goalModalOpen) refresh()
    prevGoalModalOpen.current = goalModalOpen
  }, [goalModalOpen])

  async function handleDelete() {
    if (!deletingId) return
    await deleteGoal(deletingId)
    setConfirmOpen(false)
    setDeletingId(null)
  }

  const active    = goals.filter((g) => g.status === 'active')
  const completed = goals.filter((g) => g.status === 'completed')
  const paused    = goals.filter((g) => g.status === 'paused')

  const totalTarget  = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalSaved   = goals.reduce((s, g) => s + g.current_amount, 0)
  const overallPct   = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Metas de ahorro</h1>
          <p className="text-app-text-subtle text-sm">{goals.length} meta{goals.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Button onClick={() => openGoalModal()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva meta</span>
        </Button>
      </div>

      {/* Hero summary card */}
      {!isLoading && goals.length > 0 && (
        <div className="rounded-xl border border-app-border/60 bg-app-surface p-5 flex items-center gap-4">
          <GlossyIcon icon={Target} color="#10b981" size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-app-text-subtle font-medium uppercase tracking-wide mb-1">Progreso total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-app-text">{formatCurrency(totalSaved)}</span>
              <span className="text-sm text-app-text-subtle">de {formatCurrency(totalTarget)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full mt-2 overflow-hidden" style={{ backgroundColor: '#10b98120' }}>
              <div className="h-full rounded-full transition-all duration-700 bg-income" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold tabular-nums text-income">{overallPct.toFixed(0)}%</p>
            <p className="text-xs text-app-text-subtle">{completed.length} completada{completed.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-app-border/60 bg-app-surface">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-app-surface-alt" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 bg-app-surface-alt" />
                    <Skeleton className="h-3 w-16 bg-app-surface-alt" />
                  </div>
                </div>
                <Skeleton className="h-6 w-32 bg-app-surface-alt" />
                <Skeleton className="h-2 w-full bg-app-surface-alt rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4">
            <GlossyIcon icon={Target} color="#10b981" size="lg" />
          </div>
          <p className="text-app-text font-medium">Sin metas de ahorro</p>
          <p className="text-app-text-subtle text-sm mt-1 mb-4">Define una meta y empieza a ahorrar hacia ella</p>
          <Button onClick={() => openGoalModal()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="h-4 w-4" /> Crear meta
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-app-text-subtle uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full inline-block" /> Activas ({active.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((g) => (
                  <GoalCard key={g.id} goal={g}
                    onEdit={() => openGoalModal(g.id)}
                    onDelete={() => { setDeletingId(g.id); setConfirmOpen(true) }}
                    onContribute={() => setContributeGoal(g)} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-income uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-income rounded-full inline-block" /> Completadas ({completed.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g}
                    onEdit={() => openGoalModal(g.id)}
                    onDelete={() => { setDeletingId(g.id); setConfirmOpen(true) }}
                    onContribute={() => setContributeGoal(g)} />
                ))}
              </div>
            </div>
          )}
          {paused.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-app-text-subtle uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-app-text-subtle rounded-full inline-block" /> Pausadas ({paused.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paused.map((g) => (
                  <GoalCard key={g.id} goal={g}
                    onEdit={() => openGoalModal(g.id)}
                    onDelete={() => { setDeletingId(g.id); setConfirmOpen(true) }}
                    onContribute={() => setContributeGoal(g)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GoalFormModal />
      <ContributionModal
        goal={contributeGoal}
        open={contributeGoal !== null}
        onOpenChange={(v) => { if (!v) setContributeGoal(null) }}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar meta"
        description="Se eliminarán también todos los aportes de esta meta. Esta acción no se puede deshacer."
        onConfirm={handleDelete}
      />
    </div>
  )
}
