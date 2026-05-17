import type { Metadata } from 'next'
import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sin conexión — FinTrack',
}

// Static, data-free page. Precached by the service worker and shown only
// when a navigation fails offline. Never contains financial data.
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-app-bg px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-surface-alt">
        <WifiOff className="h-7 w-7 text-app-text-subtle" aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-semibold text-app-text">Estás sin conexión</h1>
      <p className="mt-2 max-w-sm text-sm text-app-text-muted">
        No pudimos cargar esta página. Tus datos están a salvo — vuelve a intentarlo
        cuando recuperes la conexión.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Reintentar
      </Link>
    </main>
  )
}
