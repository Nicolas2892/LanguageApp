import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import { UserAvatar } from '@/components/UserAvatar'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
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
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontStyle: 'italic',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--d5-ink)',
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Mi Cuenta
        </h1>
        {/* Inline avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <UserAvatar initials={initials} size="lg" />
          <div>
            {profile.display_name && (
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--d5-ink)', lineHeight: 1.3 }}>
                {profile.display_name}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--d5-warm)' }}>{user.email}</p>
          </div>
        </div>
      </div>

      <WindingPathSeparator />

      {/* Perfil */}
      <div className="senda-card">
        <AccountForm profile={profile} mastery={{ masteredByLevel, totalByLevel }} />
      </div>

      <WindingPathSeparator />

      {/* Seguridad */}
      <div className="senda-card">
        <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />
      </div>

      <WindingPathSeparator />

      {/* Notificaciones */}
      <div className="senda-card">
        <NotificationSettings />
      </div>

      <WindingPathSeparator />

      {/* Eliminar cuenta */}
      <div className="senda-card">
        <DangerZone />
      </div>

      {profile.is_admin && (
        <>
          <WindingPathSeparator />
          <div className="senda-card flex items-center justify-between">
            <div>
              <p className="senda-eyebrow mb-1">Admin</p>
              <p style={{ fontSize: 13, color: 'var(--d5-warm)' }}>Gestión de contenido</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Abrir →</Link>
            </Button>
          </div>
        </>
      )}

      <WindingPathSeparator />

      <IOSInstallCard />
    </main>
  )
}
