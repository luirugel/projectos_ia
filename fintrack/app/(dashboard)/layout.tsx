import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { SidebarAwareMain } from '@/components/layout/SidebarAwareMain'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, currency, timezone, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-app-bg">
      <Sidebar />
      <Navbar profile={profile as Profile | null} sidebarCollapsed={false} />
      <SidebarAwareMain>
        {children}
      </SidebarAwareMain>
      <MobileNav />
    </div>
  )
}
