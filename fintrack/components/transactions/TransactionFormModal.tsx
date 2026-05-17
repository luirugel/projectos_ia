'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { useUIStore } from '@/lib/stores/uiStore'
import { useTransactionMutations } from '@/lib/hooks/useTransactionMutations'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useCategories } from '@/lib/hooks/useCategories'
import { transactionSchema, type TransactionFormValues } from '@/lib/validations/transaction'
import type { Transaction } from '@/types/database'
import { toISODate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'

const TYPE_TABS = [
  { value: 'expense', label: 'Gasto', color: 'bg-expense/20 text-expense border-expense/50' },
  { value: 'income',  label: 'Ingreso', color: 'bg-income/20 text-income border-income/50' },
  { value: 'transfer', label: 'Transferencia', color: 'bg-primary/20 text-primary border-primary/50' },
] as const

// How many recently-used categories to surface before "Ver todas".
const RECENT_LIMIT = 8

interface TransactionFormModalProps {
  onSuccess?: () => void
  /** Source for "recently used" categories. The host page already loads the
   *  transaction list — pass it here so the modal doesn't refetch it. */
  recentSource?: Transaction[]
}

export function TransactionFormModal({ onSuccess, recentSource }: TransactionFormModalProps) {
  const { transactionModalOpen, editingTransactionId, closeTransactionModal } = useUIStore()
  const { createTransaction, updateTransaction, getTransaction } = useTransactionMutations()
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const transactions = recentSource ?? []

  const [serverError, setServerError] = useState<string | null>(null)
  // Progressive disclosure: the 15-second path is type + amount + account +
  // category. Description / date / notes live behind "Más opciones" and only
  // auto-open when editing a transaction that already uses them.
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAllCats, setShowAllCats] = useState(false)

  const today = toISODate(new Date())

  const {
    register, handleSubmit, control, watch, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: today,
      is_recurring: false,
      tags: [],
    },
  })

  const watchType = watch('type')
  const watchCategory = watch('category_id')

  // Ctrl+Enter to submit. The listener is bound once per open, so it reads the
  // live submit handler through a ref instead of capturing a stale closure
  // (which would submit with an out-of-date editingTransactionId).
  const submitRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (!transactionModalOpen) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        submitRef.current?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [transactionModalOpen])

  // Reset or populate form when modal opens
  useEffect(() => {
    if (!transactionModalOpen) return
    setServerError(null)
    setShowAllCats(false)
    if (editingTransactionId) {
      getTransaction(editingTransactionId).then(({ data }) => {
        if (data) {
          reset({
            type: data.type,
            amount: data.amount,
            account_id: data.account_id,
            category_id: data.category_id,
            description: data.description,
            notes: data.notes,
            date: data.date,
            is_recurring: data.is_recurring,
            recurrence_rule: data.recurrence_rule,
            to_account_id: data.to_account_id,
            tags: data.tags ?? [],
          })
          // Don't hide data the user already entered.
          setShowAdvanced(Boolean(data.description || data.notes) || data.date !== today)
        }
      })
    } else {
      reset({ type: 'expense', date: today, is_recurring: false, tags: [] })
      setShowAdvanced(false)
    }
  }, [transactionModalOpen, editingTransactionId])

  const filteredCategories = useMemo(() => categories.filter((c) => {
    if (watchType === 'expense') return c.type === 'expense' || c.type === 'both'
    if (watchType === 'income')  return c.type === 'income'  || c.type === 'both'
    return false
  }), [categories, watchType])

  // Recently-used categories, newest first, from the latest transactions the
  // hook already loaded. Surfacing these first is the core "log in seconds"
  // accelerator (CLAUDE.md: recent categories shown first).
  const recentCategories = useMemo(() => {
    const seen = new Set<string>()
    const ordered: typeof filteredCategories = []
    for (const t of transactions) {
      if (!t.category_id || seen.has(t.category_id)) continue
      const match = filteredCategories.find((c) => c.id === t.category_id)
      if (match) { seen.add(t.category_id); ordered.push(match) }
      if (ordered.length >= RECENT_LIMIT) break
    }
    return ordered
  }, [transactions, filteredCategories])

  // The selected category must always be visible, even if it isn't recent.
  const selectedNotRecent = Boolean(
    watchCategory && !recentCategories.some((c) => c.id === watchCategory),
  )
  const collapsible = recentCategories.length > 0 && !selectedNotRecent
  const shownCategories = !collapsible || showAllCats ? filteredCategories : recentCategories

  async function onSubmit(values: TransactionFormValues) {
    setServerError(null)
    const result = editingTransactionId
      ? await updateTransaction(editingTransactionId, values)
      : await createTransaction(values)

    if (result.error) {
      setServerError(result.error)
    } else {
      closeTransactionModal()
      onSuccess?.()
    }
  }

  // Keep the Ctrl+Enter ref pointed at the current handler every render.
  submitRef.current = handleSubmit(onSubmit)

  return (
    <Dialog open={transactionModalOpen} onOpenChange={(o) => !o && closeTransactionModal()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-app-text">
            {editingTransactionId ? 'Editar transacción' : 'Nueva transacción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type tabs */}
          <div className="flex rounded-lg border border-app-border p-1 gap-1 bg-app-surface-alt/50">
            {TYPE_TABS.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setValue('type', value); setValue('category_id', null); setShowAllCats(false) }}
                aria-pressed={watchType === value}
                className={cn(
                  'flex-1 py-1.5 text-sm font-medium rounded-md border transition-colors',
                  watchType === value ? color : 'border-transparent text-app-text-subtle hover:text-app-text',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Amount — the primary field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Monto *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-subtle font-medium">$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                autoFocus
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'tx-amount-error' : undefined}
                className="no-spinner pl-7 border-app-border bg-app-surface-alt text-app-text text-lg font-semibold placeholder:text-app-text-subtle/50"
              />
            </div>
            {errors.amount && <p id="tx-amount-error" role="alert" className="text-xs text-expense">{errors.amount.message}</p>}
          </div>

          {/* Account */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Cuenta *</Label>
            <Controller name="account_id" control={control} render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-invalid={!!errors.account_id}
                  aria-describedby={errors.account_id ? 'tx-account-error' : undefined}
                  className="border-app-border bg-app-surface-alt text-app-text"
                >
                  <SelectValue placeholder="Selecciona cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.account_id && <p id="tx-account-error" role="alert" className="text-xs text-expense">{errors.account_id.message}</p>}
          </div>

          {/* Transfer: to account */}
          {watchType === 'transfer' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-app-text-muted">Cuenta destino *</Label>
              <Controller name="to_account_id" control={control} render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger
                    aria-invalid={!!errors.to_account_id}
                    aria-describedby={errors.to_account_id ? 'tx-toaccount-error' : undefined}
                    className="border-app-border bg-app-surface-alt text-app-text"
                  >
                    <SelectValue placeholder="Selecciona cuenta destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.to_account_id && <p id="tx-toaccount-error" role="alert" className="text-xs text-expense">{errors.to_account_id.message}</p>}
            </div>
          )}

          {/* Category — recent first, full list on demand (not for transfers) */}
          {watchType !== 'transfer' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-app-text-muted">Categoría</Label>
                {collapsible && (
                  <button
                    type="button"
                    onClick={() => setShowAllCats((s) => !s)}
                    aria-expanded={showAllCats}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {showAllCats ? 'Mostrar menos' : `Ver todas (${filteredCategories.length})`}
                  </button>
                )}
              </div>
              <Controller name="category_id" control={control} render={({ field }) => (
                <div className={cn(
                  'grid grid-cols-4 sm:grid-cols-5 gap-2',
                  showAllCats && 'max-h-48 overflow-y-auto pr-1',
                )}>
                  {shownCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => field.onChange(field.value === cat.id ? null : cat.id)}
                      aria-pressed={field.value === cat.id}
                      aria-label={cat.name}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs text-center transition-colors',
                        field.value === cat.id
                          ? 'border-primary bg-primary/10'
                          : 'border-app-border bg-app-surface-alt/50 hover:border-primary/40',
                      )}
                    >
                      <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                      <span className="text-app-text-muted leading-tight line-clamp-2">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )} />
            </div>
          )}

          {/* Más opciones — secondary fields, hidden until needed */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              aria-expanded={showAdvanced}
              className="flex items-center gap-1.5 text-xs font-medium text-app-text-subtle hover:text-app-text transition-colors"
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdvanced && 'rotate-180')} />
              {showAdvanced ? 'Menos opciones' : 'Más opciones'}
            </button>

            {showAdvanced && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-app-text-muted">Descripción</Label>
                  <Input
                    placeholder={watchType === 'income' ? '¿Motivo del ingreso?' : watchType === 'transfer' ? '¿Motivo de la transferencia?' : '¿En qué gastaste?'}
                    {...register('description')}
                    className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-app-text-muted">Fecha *</Label>
                  <Input
                    type="date"
                    {...register('date')}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? 'tx-date-error' : undefined}
                    className="border-app-border bg-app-surface-alt text-app-text"
                  />
                  {errors.date && <p id="tx-date-error" role="alert" className="text-xs text-expense">{errors.date.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-app-text-muted">Notas</Label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    rows={2}
                    {...register('notes')}
                    className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-app-border text-app-text-muted hover:bg-app-surface-alt hover:text-app-text"
              onClick={closeTransactionModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTransactionId ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </div>
          <p className="text-center text-xs text-app-text-subtle/60">Ctrl + Enter para guardar rápido</p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
