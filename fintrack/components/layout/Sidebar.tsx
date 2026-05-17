'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/stores/uiStore'
import { useNavCounts } from '@/lib/hooks/useNavCounts'
import { Button } from '@/components/ui/button'
import { GlossyIcon } from '@/components/shared/GlossyIcon'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; color: string; badgeKey?: 'transactions' | 'accounts' | 'goals' }[] = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard, color: '#3b82f6' },
  { href: '/transactions', label: 'Transacciones', icon: ArrowLeftRight,  color: '#10b981', badgeKey: 'transactions' },
  { href: '/accounts',     label: 'Cuentas',       icon: Wallet,          color: '#8b5cf6', badgeKey: 'accounts' },
  { href: '/budgets',      label: 'Presupuestos',  icon: PieChart,        color: '#f59e0b' },
  { href: '/goals',        label: 'Metas',         icon: Target,          color: '#06b6d4', badgeKey: 'goals' },
  { href: '/reports',      label: 'Reportes',      icon: BarChart3,       color: '#6366f1' },
]

const WORKSPACE_ITEMS: { label: string; icon: LucideIcon; color: string }[] = [
  { label: 'Asistente IA', icon: Sparkles, color: '#a855f7' },
  { label: 'Documentos',   icon: FileText, color: '#64748b' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore()
  const counts = useNavCounts()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full flex flex-col bg-app-surface border-r border-app-border/60 transition-all duration-300',
        'lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-60',
        sidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full w-60',
      )}>
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-app-border/60 shrink-0', sidebarCollapsed ? 'lg:justify-center' : 'justify-between')}>
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-primary-foreground" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold text-app-text text-lg">FinTrack</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-primary-foreground" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {/* GENERAL */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-app-text-subtle uppercase">General</p>
            )}
            {NAV_ITEMS.map(({ href, label, icon, color, badgeKey }) => {
              const active = isActive(href)
              const badge = badgeKey ? counts[badgeKey] : undefined
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium transition-all group',
                    active ? 'text-app-text' : 'text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt',
                    sidebarCollapsed && 'lg:justify-center',
                  )}
                  style={active ? { backgroundColor: `${color}12` } : undefined}
                >
                  <GlossyIcon icon={icon} color={color} size="sm" active={active} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span className="text-[10px] font-semibold text-app-text-subtle bg-app-surface-alt px-1.5 py-0.5 rounded-full tabular-nums min-w-[20px] text-center">
                          {badge > 999 ? '999+' : badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {/* ESPACIO DE TRABAJO */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-app-text-subtle uppercase">Espacio de trabajo</p>
            )}
            {WORKSPACE_ITEMS.map(({ label, icon, color }) => (
              <span
                key={label}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium text-app-text-subtle opacity-40 cursor-not-allowed select-none',
                  sidebarCollapsed && 'lg:justify-center',
                )}
              >
                <GlossyIcon icon={icon} color={color} size="sm" active={false} />
                {!sidebarCollapsed && <span className="flex-1">{label}</span>}
              </span>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-0.5 border-t border-app-border/60 pt-3">
          {(() => {
            const active = isActive('/settings')
            return (
              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? 'Configuración' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium transition-all',
                  active ? 'text-app-text' : 'text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt',
                  sidebarCollapsed && 'lg:justify-center',
                )}
                style={active ? { backgroundColor: '#64748b12' } : undefined}
              >
                <GlossyIcon icon={Settings} color="#64748b" size="sm" active={active} />
                {!sidebarCollapsed && <span className="flex-1">Configuración</span>}
              </Link>
            )
          })()}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'hidden lg:flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium text-app-text-subtle hover:bg-app-surface-alt hover:text-app-text transition-colors',
              sidebarCollapsed && 'justify-center',
            )}
          >
            {sidebarCollapsed
              ? <ChevronRight className="h-4 w-4 shrink-0" />
              : <><ChevronLeft className="h-4 w-4 shrink-0" /><span>Contraer</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}
