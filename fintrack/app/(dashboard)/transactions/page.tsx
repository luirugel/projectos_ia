'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Download, X, Receipt } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

  useEffect(() => {
    if (prevModalOpen.current && !transactionModalOpen) refresh()
    prevModalOpen.current = transactionModalOpen
  }, [transactionModalOpen])

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
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-black text-app-text tracking-tight leading-tight">Transacciones</h1>
          <span className="inline-flex items-center text-xs text-app-text-subtle bg-app-surface border border-app-border/40 px-2.5 py-1 rounded-full mt-2"
            style={{ boxShadow: 'var(--app-shadow-card)' }}>
            {loading ? '—' : `${totalCount} movimientos`}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {transactions.length > 0 && (
            <button
              onClick={() => exportTransactionsToCsv(transactions)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-app-border/60 bg-app-surface text-sm font-semibold text-app-text-muted hover:bg-app-surface-alt transition-colors duration-150"
              style={{ boxShadow: 'var(--app-shadow-card)' }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
          <button
            onClick={() => openTransactionModal()}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
            style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <span>Nueva</span>
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div
        className="bg-app-surface rounded-2xl border border-app-border/40 p-4 animate-fade-up"
        style={{ animationDelay: '60ms', boxShadow: 'var(--app-shadow-card)' }}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-text-subtle pointer-events-none" />
            <Input
              placeholder="Buscar descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-app-border/60 bg-app-surface-alt text-app-text placeholder:text-app-text-subtle focus-visible:ring-primary/40"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-xl border-app-border/60 bg-app-surface-alt text-app-text">
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
            <SelectTrigger className="w-full sm:w-44 rounded-xl border-app-border/60 bg-app-surface-alt text-app-text">
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
            <button
              aria-label="Limpiar filtros"
              onClick={clearFilters}
              className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl border border-app-border/60 bg-app-surface-alt text-app-text-subtle hover:text-app-text hover:bg-app-surface transition-colors duration-150"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-xl px-4 py-3">
          Error: {error}
        </p>
      )}

      {/* ── Transaction list ── */}
      <div
        className="bg-app-surface rounded-2xl border border-app-border/40 overflow-hidden animate-fade-up"
        style={{ animationDelay: '120ms', boxShadow: 'var(--app-shadow-md)' }}
      >
        {loading ? (
          <div className="divide-y divide-app-border/30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-9 w-9 rounded-xl bg-app-surface-alt shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40 bg-app-surface-alt" />
                  <Skeleton className="h-3 w-24 bg-app-surface-alt" />
                </div>
                <Skeleton className="h-4 w-20 bg-app-surface-alt" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-app-surface-alt flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-app-text-subtle/60" strokeWidth={1.5} />
            </div>
            <p className="text-app-text font-bold text-lg">
              {hasActiveFilters ? 'Sin resultados' : 'Sin transacciones'}
            </p>
            <p className="text-app-text-subtle text-sm mt-1 mb-6 max-w-xs">
              {hasActiveFilters
                ? 'Ningún movimiento coincide con los filtros aplicados.'
                : 'Registra tu primer movimiento para empezar.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-app-border/60 bg-app-surface text-sm font-semibold text-app-text-muted hover:bg-app-surface-alt transition-colors"
              >
                <X className="h-4 w-4" /> Limpiar filtros
              </button>
            ) : (
              <button
                onClick={() => openTransactionModal()}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
              >
                <Plus className="h-4 w-4" /> Registrar primer movimiento
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-app-border/30">
              {transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onEdit={(id) => openTransactionModal(id)}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
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
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-app-border/60 bg-app-surface text-app-text-muted hover:bg-app-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ boxShadow: 'var(--app-shadow-card)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-app-text tabular-nums px-1">
            {page + 1} <span className="text-app-text-subtle font-normal">/ {totalPages}</span>
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-app-border/60 bg-app-surface text-app-text-muted hover:bg-app-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ boxShadow: 'var(--app-shadow-card)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
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
