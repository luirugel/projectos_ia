'use client'

import { useState } from 'react'
import { Plus, Wallet, Pencil, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { AccountFormModal } from '@/components/accounts/AccountFormModal'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useUIStore } from '@/lib/stores/uiStore'
import { formatCurrency } from '@/lib/utils/currency'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  cash:        { label: 'Efectivo',        color: '#10b981' },
  bank:        { label: 'Banco',           color: '#3b82f6' },
  credit_card: { label: 'Tarjeta crédito', color: '#ef4444' },
  savings:     { label: 'Ahorros',         color: '#8b5cf6' },
  investment:  { label: 'Inversión',       color: '#f59e0b' },
}

export default function AccountsPage() {
  const { accounts, loading, deleteAccount, refresh } = useAccounts()
  const { openAccountModal } = useUIStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const totalBalance = accounts.reduce((s, a) => s + (a.current_balance ?? a.initial_balance), 0)

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-black text-app-text tracking-tight leading-tight">Cuentas</h1>
          <span
            className="inline-flex items-center text-xs text-app-text-subtle bg-app-surface border border-app-border/40 px-2.5 py-1 rounded-full mt-2"
            style={{ boxShadow: 'var(--app-shadow-card)' }}
          >
            {loading ? '—' : `${accounts.length} cuenta${accounts.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <button
          onClick={() => openAccountModal()}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 mt-1 shrink-0"
          style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva cuenta</span>
        </button>
      </div>

      {/* Hero card — net worth */}
      {!loading && accounts.length > 0 && (
        <div
          className="rounded-2xl p-5 text-white animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            animationDelay: '60ms',
            boxShadow: 'var(--app-shadow-lg)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">Patrimonio neto</p>
              <p className={`text-4xl font-black tabular-nums ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Wallet className="h-7 w-7 text-white/70" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3">
            {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} activa{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Account cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-app-surface rounded-2xl border border-app-border/40 p-5 space-y-4"
              style={{ boxShadow: 'var(--app-shadow-card)' }}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-app-surface-alt" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24 bg-app-surface-alt" />
                  <Skeleton className="h-3 w-16 bg-app-surface-alt" />
                </div>
              </div>
              <Skeleton className="h-8 w-32 bg-app-surface-alt" />
              <Skeleton className="h-1.5 w-full bg-app-surface-alt rounded-full" />
            </div>
          ))
        ) : accounts.length === 0 ? (
          <div
            className="col-span-full bg-app-surface rounded-2xl border border-app-border/40 flex flex-col items-center justify-center py-20 text-center"
            style={{ boxShadow: 'var(--app-shadow-md)' }}
          >
            <div className="h-16 w-16 rounded-2xl bg-app-surface-alt flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-app-text-subtle/60" strokeWidth={1.5} />
            </div>
            <p className="text-app-text font-bold text-lg">Sin cuentas registradas</p>
            <p className="text-app-text-subtle text-sm mt-1 mb-6">Crea tu primera cuenta para empezar</p>
            <button
              onClick={() => openAccountModal()}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
            >
              <Plus className="h-4 w-4" /> Crear primera cuenta
            </button>
          </div>
        ) : (
          accounts.map((account) => {
            const balance  = account.current_balance ?? account.initial_balance
            const typeInfo = TYPE_LABELS[account.type] ?? { label: account.type, color: account.color }
            const pct      = totalBalance > 0 ? Math.min((Math.max(balance, 0) / totalBalance) * 100, 100) : 0

            return (
              <div
                key={account.id}
                className="bg-app-surface rounded-2xl border border-app-border/40 p-5 group hover:border-app-border/70 transition-colors"
                style={{ boxShadow: 'var(--app-shadow-card)' }}
              >
                {/* Top row: icon + name + actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={account.icon ?? 'wallet'} color={account.color} size="md" />
                    <div>
                      <p className="font-semibold text-app-text leading-tight">{account.name}</p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                        style={{ backgroundColor: `${typeInfo.color}18`, color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => openAccountModal(account.id)}
                      aria-label="Editar cuenta"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(account.id)}
                      aria-label="Eliminar cuenta"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <p className={`text-2xl font-black tabular-nums mb-3 ${balance >= 0 ? 'text-app-text' : 'text-expense'}`}>
                  {formatCurrency(balance)}
                </p>

                {/* Mini progress bar — share of total */}
                {totalBalance > 0 && (
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${account.color}18` }}>
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: account.color }}
                      />
                    </div>
                    <p className="text-xs text-app-text-subtle tabular-nums text-right">
                      {pct.toFixed(0)}% del total
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <AccountFormModal onSuccess={refresh} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Desactivar cuenta"
        description="La cuenta se ocultará pero sus transacciones se conservarán."
        confirmLabel="Desactivar"
        onConfirm={async () => { if (deleteId) await deleteAccount(deleteId) }}
      />
    </div>
  )
}
