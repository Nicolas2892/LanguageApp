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
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 relative">
      <BackgroundMagicS opacity={0.03} style={{ position: 'fixed', right: 0, top: '8%', width: 480, height: 624 }} />
      {/* Header */}
      <div>
        <h1
          className="senda-heading"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}
        >
          Mi Cuenta
        </h1>
        {/* Inline avatar row */}
        <div className="flex items-center" style={{ gap: '0.875rem' }}>
          <div className="flex items-center justify-center shrink-0 rounded-full" style={{
            width: '2.75rem',
            height: '2.75rem',
            background: 'rgba(140,106,63,0.10)',
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: 'var(--d5-warm)',
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div>
            {profile.display_name && (
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--d5-ink)', lineHeight: 1.3 }} className="dark:text-[var(--d5-paper)]">
                {profile.display_name}
              </p>
            )}
            <p style={{ fontSize: '0.6875rem', color: 'var(--d5-muted)', marginTop: '0.125rem' }}>{user.email}</p>
          </div>
        </div>
      </div>

      <WindingPathSeparator />

      {/* Perfil */}
      <AccountForm profile={profile} />

      <WindingPathSeparator />

      {/* Seguridad */}
      <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />

      <WindingPathSeparator />

      {/* Notificaciones + Sesión + Danger Zone — grouped */}
      <NotificationSettings />
      <div style={{ height: '0.5rem' }} />
      <DangerZone />

      {profile.is_admin && (
        <>
          <WindingPathSeparator />
          <div className="senda-card flex items-center justify-between">
            <div>
              <p className="senda-eyebrow mb-1">Admin</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--d5-warm)' }}>Gestión de contenido</p>
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
