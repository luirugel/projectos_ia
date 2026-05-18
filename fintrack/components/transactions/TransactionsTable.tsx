'use client'

import { ArrowUp, ArrowDown, ArrowUpDown, Pencil, Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { formatDateShort } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import type { TransactionSort, TransactionSortColumn } from '@/lib/hooks/useTransactions'

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  expense:  { label: 'Gasto',         cls: 'bg-expense/10 text-expense' },
  income:   { label: 'Ingreso',       cls: 'bg-income/10 text-income' },
  transfer: { label: 'Transferencia', cls: 'bg-primary/10 text-primary' },
}

interface Props {
  transactions: Transaction[]
  sort: TransactionSort
  onSort: (column: TransactionSortColumn) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function SortableTh({
  column, label, sort, onSort, align = 'left', thClassName,
}: {
  column: TransactionSortColumn
  label: string
  sort: TransactionSort
  onSort: (c: TransactionSortColumn) => void
  align?: 'left' | 'right'
  thClassName?: string
}) {
  const active = sort.column === column
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        'px-4 py-3 text-xs font-bold uppercase tracking-widest text-app-text-subtle',
        align === 'right' ? 'text-right' : 'text-left',
        thClassName,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-label={`Ordenar por ${label.toLowerCase()}${active ? (sort.direction === 'asc' ? ', ascendente' : ', descendente') : ''}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded transition-colors hover:text-app-text',
          align === 'right' && 'flex-row-reverse',
          active && 'text-app-text',
        )}
      >
        {label}
        <Icon className={cn('h-3 w-3', !active && 'opacity-40')} />
      </button>
    </th>
  )
}

export function TransactionsTable({ transactions, sort, onSort, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-app-surface border-b border-app-border/60">
            <SortableTh column="date" label="Fecha" sort={sort} onSort={onSort} />
            <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-app-text-subtle">
              Descripción
            </th>
            <SortableTh column="account" label="Cuenta" sort={sort} onSort={onSort} thClassName="hidden lg:table-cell" />
            <SortableTh column="type" label="Tipo" sort={sort} onSort={onSort} />
            <SortableTh column="amount" label="Monto" sort={sort} onSort={onSort} align="right" />
            <th scope="col" className="px-4 py-3 w-20">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const badge = TYPE_BADGE[tx.type] ?? { label: tx.type, cls: 'bg-app-surface-alt text-app-text-muted' }
            return (
              <tr
                key={tx.id}
                onClick={() => onEdit(tx.id)}
                className="group border-b border-app-border/40 last:border-0 cursor-pointer transition-colors duration-100 hover:bg-app-surface-alt/50 focus-within:bg-app-surface-alt/50"
              >
                {/* Date */}
                <td className="px-4 py-3.5 align-middle whitespace-nowrap tabular-nums text-sm text-app-text-muted">
                  {formatDateShort(tx.date)}
                </td>

                {/* Description + category */}
                <td className="px-4 py-3.5 align-middle max-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon
                      icon={tx.category?.icon ?? 'tag'}
                      color={tx.category?.color ?? '#6366f1'}
                      size="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-app-text">
                        {tx.description ?? tx.category?.name ?? 'Sin descripción'}
                      </span>
                      {tx.description && tx.category?.name && (
                        <span className="block truncate text-xs text-app-text-subtle">
                          {tx.category.name}
                        </span>
                      )}
                    </span>
                    {tx.is_recurring && (
                      <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Recurrente
                      </span>
                    )}
                  </div>
                </td>

                {/* Account */}
                <td className="hidden lg:table-cell px-4 py-3.5 align-middle text-sm text-app-text-subtle truncate">
                  {tx.account?.name ?? '—'}
                </td>

                {/* Type badge */}
                <td className="px-4 py-3.5 align-middle">
                  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badge.cls}`}>
                    {badge.label}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-4 py-3.5 align-middle text-right">
                  <AmountDisplay amount={tx.amount} type={tx.type} size="sm" showSign className="tabular-nums font-bold" />
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 align-middle text-right">
                  <div
                    className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEdit(tx.id)}
                      aria-label="Editar transacción"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-app-text-subtle hover:text-app-text hover:bg-app-surface transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      aria-label="Eliminar transacción"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
