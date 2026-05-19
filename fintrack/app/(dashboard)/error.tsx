'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Dashboard error] digest:', error.digest)
    } else {
      console.error('[Dashboard error]', error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-expense/10 flex items-center justify-center mb-5">
        <AlertTriangle className="h-8 w-8 text-expense" strokeWidth={1.5} />
      </div>
      <p className="text-app-text font-black text-2xl tracking-tight">Algo salió mal</p>
      <p className="text-app-text-subtle text-sm mt-2 mb-7 max-w-sm">
        Se produjo un error inesperado. Tus datos están seguros — intenta de nuevo o regresa al inicio.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
        >
          <RefreshCw className="h-4 w-4" /> Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-app-border/60 text-sm font-semibold text-app-text-subtle hover:bg-app-surface-alt hover:text-app-text transition-colors"
        >
          <Home className="h-4 w-4" /> Ir al inicio
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && error.digest && (
        <p className="text-xs text-app-text-subtle/40 mt-6 font-mono">ID: {error.digest}</p>
      )}
    </div>
  )
}
