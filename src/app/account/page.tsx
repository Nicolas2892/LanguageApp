import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountForm } from './AccountForm'
import { SecurityForm } from './SecurityForm'
import { DangerZone } from './DangerZone'
import { IOSInstallCard } from './IOSInstallCard'
import type { Profile } from '@/lib/supabase/types'

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
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <div>
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
      </div>

      <AccountForm profile={profile} />

      <hr className="border-border" />

      <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />

      <hr className="border-border" />

      <DangerZone />

      <IOSInstallCard />
    </main>
  )
}
