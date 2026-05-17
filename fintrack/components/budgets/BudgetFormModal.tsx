'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { useUIStore } from '@/lib/stores/uiStore'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useCategories } from '@/lib/hooks/useCategories'
import { budgetSchema, type BudgetFormValues } from '@/lib/validations/budget'
import { cn } from '@/lib/utils'

interface BudgetFormModalProps { onSuccess?: () => void }

export function BudgetFormModal({ onSuccess }: BudgetFormModalProps) {
  const { budgetModalOpen, editingBudgetId, closeBudgetModal } = useUIStore()
  const { budgets, createBudget, updateBudget } = useBudgets()
  const { categories } = useCategories('expense')
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<BudgetFormValues>({
      resolver: zodResolver(budgetSchema),
      defaultValues: { period: 'monthly', alert_at_50: true, alert_at_80: true, alert_at_100: true, rollover: false },
    })

  useEffect(() => {
    if (!budgetModalOpen) return
    setServerError(null)
    if (editingBudgetId) {
      const b = budgets.find((x) => x.id === editingBudgetId)
      if (b) reset({ category_id: b.category_id, amount_limit: b.amount_limit, period: b.period, alert_at_50: b.alert_at_50, alert_at_80: b.alert_at_80, alert_at_100: b.alert_at_100, rollover: b.rollover })
    } else {
      reset({ period: 'monthly', alert_at_50: true, alert_at_80: true, alert_at_100: true, rollover: false })
    }
  }, [budgetModalOpen, editingBudgetId])

  async function onSubmit(values: BudgetFormValues) {
    setServerError(null)
    const result = editingBudgetId ? await updateBudget(editingBudgetId, values) : await createBudget(values)
    if (result.error) {
      setServerError(result.error)
    } else {
      closeBudgetModal()
      onSuccess?.()
    }
  }

  return (
    <Dialog open={budgetModalOpen} onOpenChange={(o) => !o && closeBudgetModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-app-text">{editingBudgetId ? 'Editar presupuesto' : 'Nuevo presupuesto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Categoría *</Label>
            <Controller name="category_id" control={control} render={({ field }) => (
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => field.onChange(cat.id)}
                    className={cn('flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors',
                      field.value === cat.id ? 'border-blue-500 bg-blue-500/10' : 'border-app-border bg-app-surface-alt/50 hover:border-app-border')}>
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    <span className="text-app-text-muted line-clamp-1">{cat.name}</span>
                  </button>
                ))}
              </div>
            )} />
            {errors.category_id && <p role="alert" className="text-xs text-expense">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-app-text-muted">Límite *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-subtle">$</span>
                <Input type="number" step="0.01" min="0.01" placeholder="0.00"
                  {...register('amount_limit', { valueAsNumber: true })}
                  className="pl-7 border-app-border bg-app-surface-alt text-app-text" />
              </div>
              {errors.amount_limit && <p role="alert" className="text-xs text-expense">{errors.amount_limit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-app-text-muted">Periodo *</Label>
              <Controller name="period" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-app-border bg-app-surface-alt text-app-text"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          {serverError && (
            <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 border-app-border text-app-text-muted hover:bg-app-surface-alt hover:text-app-text" onClick={closeBudgetModal} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBudgetId ? 'Guardar' : 'Crear presupuesto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
