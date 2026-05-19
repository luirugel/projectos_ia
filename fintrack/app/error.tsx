'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Global error] digest:', error.digest)
    } else {
      console.error(error)
    }
  }, [error])

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-expense/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-expense" />
          </div>
          <h1 className="text-xl font-bold text-app-text mb-2">Algo salió mal</h1>
          <p className="text-app-text-subtle text-sm mb-6">Ocurrió un error inesperado. Por favor intenta de nuevo.</p>
          <Button onClick={reset} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <RefreshCw className="h-4 w-4" /> Intentar de nuevo
          </Button>
        </div>
      </body>
    </html>
  )
}
