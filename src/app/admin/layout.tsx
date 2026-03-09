import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminTabNav } from '@/components/admin/AdminTabNav'
import type { Profile } from '@/lib/supabase/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
    return null  // unreachable in production (redirect throws); guards tests
  }

  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  const profile = data as Pick<Profile, 'is_admin'> | null
  if (!profile?.is_admin) {
    redirect('/dashboard')
    return null  // unreachable in production
  }

  return (
    // Counteract the root layout's lg:ml-[220px] since SideNav is hidden on /admin
    <div className="lg:-ml-[220px] lg:w-screen min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm tracking-tight">Admin</span>
            <AdminTabNav />
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
