'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Menu, Plus, Bell, Settings, LogOut, Sun, Moon, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/lib/stores/uiStore'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/types/database'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/transactions': 'Transacciones',
  '/accounts':     'Cuentas',
  '/budgets':      'Presupuestos',
  '/goals':        'Metas',
  '/reports':      'Reportes',
  '/settings':     'Configuración',
}

interface NavbarProps {
  profile: Profile | null
  sidebarCollapsed: boolean
}

export function Navbar({ profile, sidebarCollapsed }: NavbarProps) {
  const { toggleSidebar, openTransactionModal } = useUIStore()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => setMounted(true), [])

  const currentLabel = Object.entries(ROUTE_LABELS).find(([route]) => pathname === route || pathname.startsWith(route + '/'))?.[1] ?? 'Dashboard'

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleSignOut = useCallback(async () => { await signOut() }, [])

  function handleSearch(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 h-14 flex items-center gap-3 px-4 bg-app-surface/95 backdrop-blur border-b border-app-border/60 transition-all duration-300 left-0"
      style={{ left: `var(--sidebar-width, 0px)` }}
    >
      {/* Mobile hamburger */}
      <Button variant="ghost" size="icon" className="lg:hidden text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-app-text-subtle">
        <span>Espacio personal</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-app-text font-medium">{currentLabel}</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text-subtle pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Buscar transacciones, cuentas..."
            className="pl-8 pr-10 h-8 text-sm bg-app-surface-alt border-app-border/60 placeholder:text-app-text-subtle"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-app-text-subtle bg-app-bg border border-app-border/60 px-1 py-0.5 rounded hidden lg:block">⌘K</kbd>
        </div>
      </div>

      <div className="flex-1 sm:flex-none" />

      {/* New transaction */}
      <Button size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8 px-3 text-sm" onClick={() => openTransactionModal()}>
        <Plus className="h-3.5 w-3.5" />
        Nueva transacción
      </Button>
      <Button variant="ghost" size="icon" className="sm:hidden text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt h-8 w-8" onClick={() => openTransactionModal()}>
        <Plus className="h-4 w-4" />
      </Button>

      {/* Theme toggle */}
      {mounted && (
        <Button variant="ghost" size="icon" className="text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      )}

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="text-app-text-subtle hover:text-app-text hover:bg-app-surface-alt h-8 w-8 relative">
        <Bell className="h-4 w-4" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-app-surface">
            <Avatar className="h-7 w-7">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 border-app-border bg-app-surface">
          <DropdownMenuLabel className="text-app-text-muted">
            <div className="font-semibold truncate">{profile?.full_name ?? 'Usuario'}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-app-border" />
          <DropdownMenuItem className="text-app-text-muted hover:text-app-text focus:bg-app-surface-alt cursor-pointer" onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" /> Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-app-border" />
          <DropdownMenuItem className="text-red-500 hover:text-red-600 focus:bg-app-surface-alt focus:text-red-600 cursor-pointer" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
