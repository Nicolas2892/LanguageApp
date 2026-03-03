import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountForm } from './AccountForm'
import { SecurityForm } from './SecurityForm'
import { DangerZone } from './DangerZone'
import { IOSInstallCard } from './IOSInstallCard'
import type { Profile } from '@/lib/supabase/types'

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email[0].toUpperCase()
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileData) redirect('/dashboard')
  const profile = profileData as Profile

  const isOAuthUser = user.app_metadata?.provider === 'google'

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-4 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg shrink-0 select-none">
          {getInitials(profile.display_name, user.email!)}
        </div>
        <div>
          <h1 className="text-xl font-bold">Account</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5">
        <AccountForm profile={profile} />
      </div>

      <div className="bg-card rounded-xl border p-5">
        <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />
      </div>

      <div className="bg-card rounded-xl border p-5">
        <DangerZone />
      </div>

      <IOSInstallCard />
    </main>
  )
}
