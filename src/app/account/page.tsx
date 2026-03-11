import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
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

  const profileRes = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profileRes.data) redirect('/dashboard')
  const profile = profileRes.data as Profile

  const isOAuthUser = user.app_metadata?.provider === 'google'
  const initials = getInitials(profile.display_name, user.email!)

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 relative">
      <BackgroundMagicS style={{ position: 'fixed', right: 0, top: '8%', width: 480, height: 624 }} />
      {/* Header */}
      <div className="mb-6">
        <h1 className="senda-heading text-2xl mb-3">
          Mi Cuenta
        </h1>
        {/* Inline avatar row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center shrink-0 rounded-full senda-card-sm" style={{
            width: '2.75rem',
            height: '2.75rem',
            padding: 0,
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--d5-warm)',
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div>
            {profile.display_name && (
              <p className="text-sm font-semibold dark:text-[var(--d5-paper)]" style={{ color: 'var(--d5-ink)', lineHeight: 1.3 }}>
                {profile.display_name}
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: 'var(--d5-muted)' }}>{user.email}</p>
          </div>
        </div>
      </div>

      <WindingPathSeparator />

      {/* Perfil */}
      <div className="mt-6">
        <AccountForm profile={profile} />
      </div>

      <div className="mt-8">
        <WindingPathSeparator />
      </div>

      {/* Seguridad */}
      <div className="mt-6">
        <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />
      </div>

      <div className="mt-8">
        <WindingPathSeparator />
      </div>

      {/* Notificaciones + Sesión + Danger Zone — grouped */}
      <div className="mt-6">
        <NotificationSettings />
      </div>
      <div className="mt-8">
        <DangerZone />
      </div>

      {profile.is_admin && (
        <>
          <div className="mt-12">
            <WindingPathSeparator />
          </div>
          <div className="senda-card flex items-center justify-between mt-6">
            <div>
              <p className="senda-eyebrow mb-1">Admin</p>
              <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Gestión de contenido</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Abrir →</Link>
            </Button>
          </div>
        </>
      )}

      <div className="mt-8">
        <WindingPathSeparator />
      </div>

      <div className="mt-6">
        <IOSInstallCard />
      </div>
    </main>
  )
}
