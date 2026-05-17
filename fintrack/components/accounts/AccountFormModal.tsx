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
import { useUIStore } from '@/lib/stores/uiStore'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { accountSchema, type AccountFormValues } from '@/lib/validations/account'

const COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

interface AccountFormModalProps { onSuccess?: () => void }

export function AccountFormModal({ onSuccess }: AccountFormModalProps) {
  const { accountModalOpen, editingAccountId, closeAccountModal } = useUIStore()
  const { accounts, createAccount, updateAccount } = useAccounts()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<AccountFormValues>({
      resolver: zodResolver(accountSchema),
      defaultValues: { type: 'bank', initial_balance: 0, color: '#6366f1', icon: 'wallet' },
    })

  useEffect(() => {
    if (!accountModalOpen) return
    setServerError(null)
    if (editingAccountId) {
      const acc = accounts.find((a) => a.id === editingAccountId)
      if (acc) reset({ name: acc.name, type: acc.type, initial_balance: acc.initial_balance, color: acc.color, icon: acc.icon })
    } else {
      reset({ type: 'bank', initial_balance: 0, color: '#6366f1', icon: 'wallet' })
    }
  }, [accountModalOpen, editingAccountId])

  async function onSubmit(values: AccountFormValues) {
    setServerError(null)
    const result = editingAccountId
      ? await updateAccount(editingAccountId, values)
      : await createAccount(values)
    if (result.error) {
      setServerError(result.error)
    } else {
      closeAccountModal()
      onSuccess?.()
    }
  }

  return (
    <Dialog open={accountModalOpen} onOpenChange={(o) => !o && closeAccountModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-app-text">{editingAccountId ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Nombre *</Label>
            <Input {...register('name')} placeholder="Mi cuenta bancaria"
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60" />
            {errors.name && <p role="alert" className="text-xs text-expense">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Tipo *</Label>
            <Controller name="type" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="border-app-border bg-app-surface-alt text-app-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="bank">Banco</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de credito</SelectItem>
                  <SelectItem value="savings">Ahorros</SelectItem>
                  <SelectItem value="investment">Inversion</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Balance inicial</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-subtle">$</span>
              <Input type="number" step="0.01" {...register('initial_balance', { valueAsNumber: true })}
                className="pl-7 border-app-border bg-app-surface-alt text-app-text" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Color</Label>
            <Controller name="color" control={control} render={({ field }) => (
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => field.onChange(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${field.value === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            )} />
          </div>

          {serverError && (
            <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 border-app-border text-app-text-muted hover:bg-app-surface-alt hover:text-app-text"
              onClick={closeAccountModal} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccountId ? 'Guardar' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
