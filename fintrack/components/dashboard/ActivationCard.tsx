'use client'

import Link from 'next/link'
import { Check, Lock, Wallet, PlusCircle, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  accounts: number
  transactions: number
  goals: number
  onLogTransaction: () => void
}

type StepState = 'done' | 'active' | 'locked' | 'optional'

function StepRow({
  icon: Icon, title, desc, state, action,
}: {
  icon: LucideIcon
  title: string
  desc: string
  state: StepState
  action: React.ReactNode
}) {
  const done = state === 'done'
  const locked = state === 'locked'
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          done
            ? 'bg-income/15 text-income'
            : locked
            ? 'bg-app-surface-alt text-app-text-subtle'
            : 'bg-primary/12 text-primary'
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={2} />
          : locked ? <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
          : <Icon className="h-4 w-4" strokeWidth={1.75} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? 'text-app-text-subtle line-through' : 'text-app-text'}`}>
          {title}
        </p>
        <p className="text-xs text-app-text-subtle">{desc}</p>
      </div>
      <div className="shrink-0">{!done && action}</div>
    </div>
  )
}

export function ActivationCard({ accounts, transactions, goals, onLogTransaction }: Props) {
  const hasAccount = accounts > 0
  const hasTx = transactions > 0
  const hasGoal = goals > 0
  const coreDone = (hasAccount ? 1 : 0) + (hasTx ? 1 : 0)

  const cta = 'inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
  const ctaGhost = 'inline-flex h-9 items-center justify-center rounded-md border border-app-border px-3 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-alt'

  return (
    <section className="rounded-2xl border border-app-border/70 bg-app-surface p-5 sm:p-6" style={{ boxShadow: 'var(--app-shadow-lg)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-app-text">Empieza a ver tu progreso</h2>
        <span className="text-xs font-medium tabular-nums text-app-text-subtle">{coreDone}/2</span>
      </div>
      <p className="mt-1 text-sm text-app-text-subtle">
        Dos pasos para que FinTrack empiece a trabajar para ti.
      </p>

      <div className="mt-3 h-1.5 rounded-full bg-app-surface-alt overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${(coreDone / 2) * 100}%` }}
        />
      </div>

      <div className="mt-2 divide-y divide-app-border/50">
        <StepRow
          icon={Wallet}
          title="Crea tu primera cuenta"
          desc="Una billetera, banco o efectivo donde se mueve tu dinero."
          state={hasAccount ? 'done' : 'active'}
          action={<Link href="/accounts" className={cta}>Crear cuenta</Link>}
        />
        <StepRow
          icon={PlusCircle}
          title="Registra tu primer movimiento"
          desc="Un gasto o ingreso. Toma menos de 15 segundos."
          state={hasTx ? 'done' : hasAccount ? 'active' : 'locked'}
          action={
            <button type="button" onClick={onLogTransaction} className={cta} disabled={!hasAccount}>
              Registrar
            </button>
          }
        />
        <StepRow
          icon={Target}
          title="Define una meta de ahorro"
          desc="Opcional, pero ver una meta crecer es lo que engancha."
          state={hasGoal ? 'done' : 'optional'}
          action={<Link href="/goals" className={ctaGhost}>Crear meta</Link>}
        />
      </div>
    </section>
  )
}
