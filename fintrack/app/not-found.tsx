import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-app-border mb-4">404</p>
        <h1 className="text-xl font-bold text-app-text mb-2">Página no encontrada</h1>
        <p className="text-app-text-subtle text-sm mb-6">La página que buscas no existe o fue movida.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
          <Home className="h-4 w-4" /> Ir al inicio
        </Link>
      </div>
    </div>
  )
}
