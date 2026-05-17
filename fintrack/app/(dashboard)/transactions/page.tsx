'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Download, X, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionCard } from '@/components/transactions/TransactionCard'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useTransactions, PAGE_SIZE } from '@/lib/hooks/useTransactions'
import { useUIStore } from '@/lib/stores/uiStore'
import { exportTransactionsToCsv } from '@/lib/utils/export'
import { useSearchParams } from 'next/navigation'
import { getCurrentMonthRange, getLastMonthRange, getCurrentYearRange } from '@/lib/utils/dates'

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { openTransactionModal, transactionModalOpen } = useUIStore()
  const searchParams = useSearchParams()
  const prevModalOpen = useRef(false)

  const { transactions, loading, error, totalCount, page, setPage, setFilters, sort, setSort, refresh, deleteTransaction } =
    useTransactions()

  useEffect(() => {
    if (searchParams.get('new') === '1') openTransactionModal()
  }, [])

  // Refresh list whenever the transaction modal closes
  useEffect(() => {
    if (prevModalOpen.current && !transactionModalOpen) {
      refresh()
    }
    prevModalOpen.current = transactionModalOpen
  }, [transactionModalOpen])

  // Live, debounced filtering — no manual "apply" step. Skip the first run
  // so we don't double-fetch on mount (the hook already loads once).
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    const t = setTimeout(() => {
      const range =
        dateRange === 'month'     ? getCurrentMonthRange() :
        dateRange === 'lastMonth' ? getLastMonthRange() :
        dateRange === 'year'      ? getCurrentYearRange() :
        undefined
      setFilters({
        type: typeFilter === 'all' ? undefined : (typeFilter as 'expense' | 'income' | 'transfer'),
        search: search.trim() || undefined,
        start: range?.start,
        end: range?.end,
      })
    }, 300)
    return () => clearTimeout(t)
  }, [search, typeFilter, dateRange, setFilters])

  function clearFilters() {
    setSearch('')
    setTypeFilter('all')
    setDateRange('all')
  }

  const hasActiveFilters = typeFilter !== 'all' || dateRange !== 'all' || search.trim() !== ''
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Transacciones</h1>
          <p className="text-app-text-subtle text-sm">{totalCount} movimientos</p>
        </div>
        <div className="flex gap-2">
          {transactions.length > 0 && (
            <Button variant="outline" className="border-app-border text-app-text-muted hover:bg-app-surface-alt gap-2"
              onClick={() => exportTransactionsToCsv(transactions)}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          )}
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => openTransactionModal()}>
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </div>
      </div>

      <Card className="border-app-border/60 bg-app-surface">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-text-subtle" />
              <Input
                placeholder="Buscar descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36 border-app-border bg-app-surface-alt text-app-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="expense">Gastos</SelectItem>
                <SelectItem value="income">Ingresos</SelectItem>
                <SelectItem value="transfer">Transferencias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-44 border-app-border bg-app-surface-alt text-app-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier fecha</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="lastMonth">Mes pasado</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" aria-label="Limpiar filtros" className="border-app-border text-app-text-subtle hover:bg-app-surface-alt hover:text-app-text-muted shrink-0" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">
          Error: {error}
        </p>
      )}

      <Card className="border-app-border/60 bg-app-surface overflow-hidden">
        <CardContent className="p-2 md:p-0">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 md:px-4">
                <Skeleton className="h-9 w-9 rounded-lg bg-app-surface-alt" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40 bg-app-surface-alt" />
                  <Skeleton className="h-3 w-24 bg-app-surface-alt" />
                </div>
                <Skeleton className="h-4 w-20 bg-app-surface-alt" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-12 w-12 text-app-text-subtle mb-4" />
              <p className="text-app-text font-medium text-lg">
                {hasActiveFilters ? 'Sin resultados' : 'Sin transacciones'}
              </p>
              <p className="text-app-text-subtle text-sm mt-1 mb-4">
                {hasActiveFilters
                  ? 'Ningún movimiento coincide con los filtros aplicados.'
                  : 'Registra tu primer movimiento para empezar.'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" className="border-app-border text-app-text-muted hover:bg-app-surface-alt gap-2" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Limpiar filtros
                </Button>
              ) : (
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => openTransactionModal()}>
                  <Plus className="h-4 w-4" /> Registrar primer movimiento
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile (<md): stacked rows — a table doesn't fit 375px */}
              <div className="md:hidden">
                {transactions.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    onEdit={(id) => openTransactionModal(id)}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
              {/* Tablet/desktop (≥md): scannable table */}
              <div className="hidden md:block">
                <TransactionsTable
                  transactions={transactions}
                  sort={sort}
                  onSort={setSort}
                  onEdit={(id) => openTransactionModal(id)}
                  onDelete={setDeleteId}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" className="border-app-border text-app-text-muted hover:bg-app-surface-alt"
            onClick={() => setPage(page - 1)} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-app-text-subtle">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" className="border-app-border text-app-text-muted hover:bg-app-surface-alt"
            onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <TransactionFormModal recentSource={transactions} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Eliminar transaccion"
        description="Esta accion no se puede deshacer."
        onConfirm={async () => { if (deleteId) await deleteTransaction(deleteId) }}
      />
    </div>
  )
}
