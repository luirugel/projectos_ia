'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-14 h-14 bg-expense/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-expense" />
      </div>
      <h2 className="text-lg font-bold text-app-text mb-2">Algo salió mal</h2>
      <p className="text-app-text-subtle text-sm mb-2 max-w-xs">
        Ocurrió un error inesperado en esta página.
      </p>
      {error.digest && (
        <p className="text-app-text-subtle/70 text-[11px] mb-2">
          Código de referencia: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
        <RefreshCw className="h-4 w-4" /> Intentar de nuevo
      </Button>
    </div>
  )
}
