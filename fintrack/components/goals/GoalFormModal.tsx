'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/lib/stores/uiStore'
import { useGoals } from '@/lib/hooks/useGoals'
import { goalSchema, type GoalFormValues } from '@/lib/validations/goal'

const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899','#06b6d4','#6366f1']

interface GoalFormModalProps { onSuccess?: () => void }

export function GoalFormModal({ onSuccess }: GoalFormModalProps) {
  const { goalModalOpen, editingGoalId, closeGoalModal } = useUIStore()
  const { goals, createGoal, updateGoal } = useGoals()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<GoalFormValues>({
      resolver: zodResolver(goalSchema),
      defaultValues: { icon: 'target', color: '#10b981', current_amount: 0 },
    })

  const watchColor = watch('color')

  useEffect(() => {
    if (!goalModalOpen) return
    setServerError(null)
    if (editingGoalId) {
      const g = goals.find((x) => x.id === editingGoalId)
      if (g) reset({ name: g.name, description: g.description, target_amount: g.target_amount, current_amount: g.current_amount, target_date: g.target_date ?? undefined, icon: g.icon, color: g.color })
    } else {
      reset({ icon: 'target', color: '#10b981', current_amount: 0 })
    }
  }, [goalModalOpen, editingGoalId])

  async function onSubmit(values: GoalFormValues) {
    setServerError(null)
    const result = editingGoalId ? await updateGoal(editingGoalId, values) : await createGoal(values)
    if (result.error) {
      setServerError(result.error)
    } else {
      closeGoalModal()
      onSuccess?.()
    }
  }

  return (
    <Dialog open={goalModalOpen} onOpenChange={(o) => !o && closeGoalModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-app-text">{editingGoalId ? 'Editar meta' : 'Nueva meta de ahorro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Nombre *</Label>
            <Input {...register('name')} placeholder="Ej: Vacaciones en Europa"
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60" />
            {errors.name && <p role="alert" className="text-xs text-expense">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Descripcion</Label>
            <Textarea {...register('description')} placeholder="Descripcion opcional..." rows={2}
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-app-text-muted">Meta *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-subtle">$</span>
                <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...register('target_amount', { valueAsNumber: true })}
                  className="pl-7 border-app-border bg-app-surface-alt text-app-text" />
              </div>
              {errors.target_amount && <p role="alert" className="text-xs text-expense">{errors.target_amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-app-text-muted">Fecha limite</Label>
              <Input type="date" {...register('target_date')}
                className="border-app-border bg-app-surface-alt text-app-text" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setValue('color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${watchColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {serverError && (
            <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 border-app-border text-app-text-muted hover:bg-app-surface-alt hover:text-app-text" onClick={closeGoalModal} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGoalId ? 'Guardar' : 'Crear meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
