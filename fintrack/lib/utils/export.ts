import type { Transaction } from '@/types/database'
import { formatCurrency } from './currency'

const TYPE_LABEL: Record<string, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTransactionsToCsv(transactions: Transaction[]): void {
  const headers = ['Fecha', 'Tipo', 'Monto', 'Cuenta', 'Categoría', 'Descripción', 'Notas', 'Etiquetas']

  const rows = transactions.map((tx) => [
    tx.date,
    TYPE_LABEL[tx.type] ?? tx.type,
    tx.amount,
    tx.account?.name ?? '',
    tx.category?.name ?? '',
    tx.description ?? '',
    tx.notes ?? '',
    (tx.tags ?? []).join('; '),
  ])

  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n')

  const bom = '﻿' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `fintrack-transacciones-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
