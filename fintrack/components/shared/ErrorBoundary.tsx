'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-expense/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-expense" strokeWidth={1.5} />
          </div>
          <p className="text-app-text font-bold text-base">Algo salió mal</p>
          <p className="text-app-text-subtle text-sm mt-1 mb-5 max-w-xs">
            No se pudo cargar esta sección. Intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-app-border/60 text-sm font-semibold text-app-text-subtle hover:bg-app-surface-alt hover:text-app-text transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
