import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import { UserAvatar } from '@/components/UserAvatar'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { AccountForm } from './AccountForm'
import { SecurityForm } from './SecurityForm'
import { DangerZone } from './DangerZone'
import { IOSInstallCard } from './IOSInstallCard'
import { NotificationSettings } from '@/components/NotificationSettings'
import type { Profile } from '@/lib/supabase/types'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, masteryRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('concepts')
      .select('level, user_progress!inner(production_mastered, interval_days)')
      .eq('user_progress.user_id', user.id),
  ])

  if (!profileRes.data) redirect('/dashboard')
  const profile = profileRes.data as Profile

  // Build mastery breakdown by CEFR level
  type MasteryRow = { level: string; user_progress: { production_mastered: boolean; interval_days: number }[] }
  const totalByLevel: Record<string, number> = {}
  const masteredByLevel: Record<string, number> = {}
  for (const row of ((masteryRes.data ?? []) as MasteryRow[])) {
    totalByLevel[row.level] = (totalByLevel[row.level] ?? 0) + 1
    const progress = row.user_progress[0]
    if (progress?.interval_days >= MASTERY_THRESHOLD && progress?.production_mastered) {
      masteredByLevel[row.level] = (masteredByLevel[row.level] ?? 0) + 1
    }
  }

  const isOAuthUser = user.app_metadata?.provider === 'google'
  const initials = getInitials(profile.display_name, user.email!)

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-4 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <div className="flex items-center gap-4">
        <UserAvatar initials={initials} size="lg" />
        <div>
          <h1 className="text-xl font-bold">Account</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5">
        <AccountForm profile={profile} mastery={{ masteredByLevel, totalByLevel }} />
      </div>

      <div className="bg-card rounded-xl border p-5">
        <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />
      </div>

      <div className="bg-card rounded-xl border p-5">
        <NotificationSettings />
      </div>

      <div className="bg-card rounded-xl border p-5">
        <DangerZone />
      </div>

      <IOSInstallCard />
    </main>
  )
}
