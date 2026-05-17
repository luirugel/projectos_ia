'use client'

import { Flame, Check, Zap } from 'lucide-react'
import { useStreak } from '@/lib/hooks/useStreak'

function dayLetter(offsetFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetFromToday)
  return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()]
}

export function MomentumStreak() {
  const { streak, week, loggedToday, loading } = useStreak()

  if (loading) {
    return <div className="rounded-xl border border-app-border/60 bg-app-surface p-4 h-[68px] animate-pulse" />
  }

  const weekCount = week.filter(Boolean).length
  const hasStreak = streak > 0
  const streakBg = hasStreak
    ? 'bg-app-surface border-app-border/60'
    : 'bg-app-surface border-app-border/60'

  return (
    <div
      className={`rounded-xl border ${streakBg} px-4 py-3 flex items-center justify-between gap-4`}
      style={{ boxShadow: 'var(--app-shadow-card)' }}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            hasStreak ? 'bg-primary/10' : 'bg-app-surface-alt'
          }`}
        >
          {hasStreak ? (
            <Flame className="h-4 w-4 text-primary" strokeWidth={2} />
          ) : (
            <Zap className="h-4 w-4 text-app-text-subtle" strokeWidth={1.75} />
          )}
        </div>

        <div className="min-w-0">
          {hasStreak ? (
            <p className="text-sm text-app-text leading-tight">
              <span className="font-black tabular-nums text-primary">{streak}</span>{' '}
              <span className="font-medium">{streak === 1 ? 'día seguido' : 'días seguidos'} registrando</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-app-text">Empieza tu racha hoy</p>
          )}
          <p className="text-xs text-app-text-subtle mt-0.5 flex items-center gap-1">
            <span>{weekCount} de 7 días esta semana</span>
            {loggedToday && (
              <span className="inline-flex items-center gap-0.5 text-income font-medium">
                <Check className="h-3 w-3" strokeWidth={2.5} /> hoy listo
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right: 7-day dots */}
      <div className="flex items-end gap-1.5 shrink-0" aria-hidden>
        {week.map((on, i) => {
          const isToday = i === 6
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`rounded-full transition-all duration-200 ${
                  on
                    ? isToday
                      ? 'h-3 w-3 bg-primary ring-2 ring-primary/25'
                      : 'h-2.5 w-2.5 bg-primary/70'
                    : isToday
                    ? 'h-3 w-3 bg-transparent border-2 border-app-text-subtle/40'
                    : 'h-2.5 w-2.5 bg-app-surface-alt border border-app-border/60'
                }`}
              />
              <span className={`text-[9px] leading-none tabular-nums ${isToday ? 'text-app-text-muted font-semibold' : 'text-app-text-subtle'}`}>
                {dayLetter(6 - i)}
              </span>
            </div>
          )
        })}
      </div>

      <span className="sr-only">
        {`Has registrado movimientos ${weekCount} de los últimos 7 días.`}
      </span>
    </div>
  )
}
