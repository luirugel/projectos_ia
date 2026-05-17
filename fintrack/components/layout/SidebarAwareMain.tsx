'use client'

import { useUIStore } from '@/lib/stores/uiStore'
import { cn } from '@/lib/utils'

export function SidebarAwareMain({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <main
      className={cn(
        'transition-all duration-300 pt-14 pb-20 lg:pb-6 min-h-screen',
        sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60',
      )}
    >
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  )
}
