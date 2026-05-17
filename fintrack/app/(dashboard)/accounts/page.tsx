'use client'

import { useState } from 'react'
import { Plus, Wallet, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { GlossyIcon } from '@/components/shared/GlossyIcon'
import { AccountFormModal } from '@/components/accounts/AccountFormModal'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useUIStore } from '@/lib/stores/uiStore'
import { formatCurrency } from '@/lib/utils/currency'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  cash:        { label: 'Efectivo',         color: '#10b981' },
  bank:        { label: 'Banco',            color: '#3b82f6' },
  credit_card: { label: 'Tarjeta crédito',  color: '#ef4444' },
  savings:     { label: 'Ahorros',          color: '#8b5cf6' },
  investment:  { label: 'Inversión',        color: '#f59e0b' },
}

export default function AccountsPage() {
  const { accounts, loading, deleteAccount, refresh } = useAccounts()
  const { openAccountModal } = useUIStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const totalBalance = accounts.reduce((s, a) => s + (a.current_balance ?? a.initial_balance), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Cuentas</h1>
          <p className="text-app-text-subtle text-sm">
            Balance total:{' '}
            <span className={totalBalance >= 0 ? 'text-app-text font-semibold' : 'text-expense font-semibold'}>
              {formatCurrency(totalBalance)}
            </span>
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => openAccountModal()}>
          <Plus className="h-4 w-4" /> Nueva cuenta
        </Button>
      </div>

      {/* Total balance hero card */}
      {!loading && accounts.length > 0 && (
        <div className="rounded-xl border border-app-border/60 bg-app-surface p-5 flex items-center gap-4">
          <GlossyIcon icon={Wallet} color="#3b82f6" size="lg" />
          <div>
            <p className="text-xs text-app-text-subtle font-medium uppercase tracking-wide">Patrimonio neto</p>
            <p className={`text-3xl font-bold tabular-nums mt-0.5 ${totalBalance >= 0 ? 'text-app-text' : 'text-expense'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-app-text-subtle">{accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}</p>
          </div>
        </div>
      )}

      {/* Account cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-app-border/60 bg-app-surface">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-app-surface-alt" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24 bg-app-surface-alt" />
                    <Skeleton className="h-3 w-16 bg-app-surface-alt" />
                  </div>
                </div>
                <Skeleton className="h-7 w-32 bg-app-surface-alt" />
              </CardContent>
            </Card>
          ))
        ) : accounts.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="flex justify-center mb-4">
              <GlossyIcon icon={Wallet} color="#3b82f6" size="lg" />
            </div>
            <p className="text-app-text font-medium">No tienes cuentas registradas</p>
            <p className="text-app-text-subtle text-sm mt-1">Crea tu primera cuenta para empezar</p>
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => openAccountModal()}>
              Crear primera cuenta
            </Button>
          </div>
        ) : (
          accounts.map((account) => {
            const balance = account.current_balance ?? account.initial_balance
            const typeInfo = TYPE_LABELS[account.type] ?? { label: account.type, color: account.color }
            const pct = totalBalance > 0 ? Math.min((Math.max(balance, 0) / totalBalance) * 100, 100) : 0

            return (
              <Card key={account.id} className="border-app-border/60 bg-app-surface group hover:border-app-border transition-colors">
                <CardContent className="p-5">
                  {/* Top row: icon + name + actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CategoryIcon icon={account.icon ?? 'wallet'} color={account.color} size="md" />
                      <div>
                        <p className="font-semibold text-app-text leading-tight">{account.name}</p>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{
                            backgroundColor: `${typeInfo.color}18`,
                            color: typeInfo.color,
                          }}
                        >
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <button
                        onClick={() => openAccountModal(account.id)}
                        aria-label="Editar cuenta"
                        className="p-1.5 rounded-md text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(account.id)}
                        aria-label="Eliminar cuenta"
                        className="p-1.5 rounded-md text-app-text-subtle hover:text-expense hover:bg-expense/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <p className={`text-2xl font-bold tabular-nums mb-3 ${balance >= 0 ? 'text-app-text' : 'text-expense'}`}>
                    {formatCurrency(balance)}
                  </p>

                  {/* Mini progress bar — share of total */}
                  {totalBalance > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${account.color}18` }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: account.color }}
                        />
                      </div>
                      <p className="text-[10px] text-app-text-subtle tabular-nums text-right">
                        {pct.toFixed(0)}% del total
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
