'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { formatDateRelative } from '@/lib/utils/dates'
import type { Transaction } from '@/types/database'

interface TransactionCardProps {
  transaction: Transaction
  onDelete: (id: string) => void
  onEdit:   (id: string) => void
}

export function TransactionCard({ transaction: tx, onDelete, onEdit }: TransactionCardProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 hover:bg-app-surface-alt/50 transition-colors duration-150 group">
      <CategoryIcon
        icon={tx.category?.icon ?? 'tag'}
        color={tx.category?.color ?? '#6366f1'}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-app-text truncate">
          {tx.description ?? tx.category?.name ?? 'Sin descripción'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-app-text-subtle">{tx.account?.name}</span>
          <span className="text-xs text-app-text-subtle">·</span>
          <span className="text-xs text-app-text-subtle">{formatDateRelative(tx.date)}</span>
          {tx.is_recurring && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Recurrente
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <AmountDisplay amount={tx.amount} type={tx.type} size="sm" showSign />
        <div className="flex items-center gap-0.5 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            onClick={() => onEdit(tx.id)}
            aria-label="Editar transacción"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 rounded-lg text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(tx.id)}
            aria-label="Eliminar transacción"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 rounded-lg text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
