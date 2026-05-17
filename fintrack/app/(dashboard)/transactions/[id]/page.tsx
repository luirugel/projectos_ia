'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useUIStore } from '@/lib/stores/uiStore'
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatDateLong } from '@/lib/utils/dates'
import type { Transaction } from '@/types/database'

const TYPE_LABEL: Record<string, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { transactions, loading: isLoading, deleteTransaction } = useTransactions()
  const { openTransactionModal } = useUIStore()
  const [tx, setTx] = useState<Transaction | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? ''

  useEffect(() => {
    if (!isLoading) {
      const found = transactions.find((t) => t.id === id)
      setTx(found ?? null)
    }
  }, [transactions, isLoading, id])

  async function handleDelete() {
    if (!tx) return
    setDeleting(true)
    await deleteTransaction(tx.id)
    setDeleting(false)
    setConfirmOpen(false)
    router.push('/transactions')
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-app-text-subtle animate-spin" />
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" className="text-app-text-subtle hover:text-app-text mb-4 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <p className="text-app-text-subtle">Transacción no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-lg">
      <Button variant="ghost" className="text-app-text-subtle hover:text-app-text mb-4 gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <div className="bg-app-surface border border-app-border/60 rounded-xl p-6 space-y-5 card-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CategoryIcon icon={tx.category?.icon ?? 'tag'} color={tx.category?.color ?? '#6366f1'} size="lg" />
            <div>
              <p className="font-semibold text-app-text text-lg leading-tight">
                {tx.description ?? tx.category?.name ?? 'Sin descripción'}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${
                tx.type === 'income' ? 'bg-income/20 text-income border-income/30' :
                tx.type === 'transfer' ? 'bg-primary/15 text-primary border-primary/30' :
                'bg-expense/20 text-expense border-expense/30'
              }`}>
                {TYPE_LABEL[tx.type]}
              </span>
            </div>
          </div>
          <AmountDisplay amount={tx.amount} type={tx.type} size="lg" showSign />
        </div>

        <div className="border-t border-app-border pt-4 space-y-3">
          <Row label="Fecha" value={formatDateLong(tx.date)} />
          <Row label="Cuenta" value={tx.account?.name ?? '—'} />
          {tx.category && <Row label="Categoría" value={tx.category.name} />}
          {tx.notes && <Row label="Notas" value={tx.notes} />}
          {tx.is_recurring && <Row label="Recurrente" value={tx.recurrence_rule ?? 'Sí'} />}
          {tx.tags && tx.tags.length > 0 && (
            <div className="flex gap-2 items-start">
              <span className="text-xs text-app-text-subtle w-24 flex-shrink-0 mt-0.5 font-medium">Etiquetas</span>
              <div className="flex flex-wrap gap-1.5">
                {tx.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-app-surface-alt text-app-text-muted px-2 py-0.5 rounded-full border border-app-border/60">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 border-app-border text-app-text-muted hover:bg-app-surface-alt"
            onClick={() => openTransactionModal(tx.id)}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-expense/50 text-expense hover:bg-expense/10 hover:border-expense"
            onClick={() => setConfirmOpen(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <TransactionFormModal recentSource={transactions} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar transacción"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-app-text-subtle w-24 flex-shrink-0 mt-0.5 font-medium">{label}</span>
      <span className="text-sm text-app-text">{value}</span>
    </div>
  )
}
