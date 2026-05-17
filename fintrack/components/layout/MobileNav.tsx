'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard',    label: 'Inicio',     icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', icon: ArrowLeftRight  },
  { href: '/accounts',     label: 'Cuentas',    icon: Wallet          },
  { href: '/budgets',      label: 'Presupuesto', icon: PieChart        },
  { href: '/goals',        label: 'Metas',      icon: Target          },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-app-surface border-t border-app-border/60 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors',
              isActive(href) ? 'text-primary' : 'text-app-text-subtle',
            )}
          >
            <Icon className={cn('h-5 w-5', isActive(href) ? 'text-primary' : 'text-app-text-subtle')} />
            <span className="leading-none">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
