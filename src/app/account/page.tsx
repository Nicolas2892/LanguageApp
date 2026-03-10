import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
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

  const profileRes = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profileRes.data) redirect('/dashboard')
  const profile = profileRes.data as Profile

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
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(26,17,8,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 15,
            fontWeight: 700,
            color: 'rgba(26,17,8,0.40)',
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div>
            {profile.display_name && (
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--d5-ink)', lineHeight: 1.3 }}>
                {profile.display_name}
              </p>
            )}
            <p style={{ fontSize: 11, color: 'var(--d5-muted)', marginTop: 2 }}>{user.email}</p>
          </div>
        </div>
      </div>

      <WindingPathSeparator />

      {/* Perfil */}
      <div>
        <AccountForm profile={profile} />
      </div>

      <WindingPathSeparator />

      {/* Seguridad */}
      <div>
        <SecurityForm userEmail={user.email!} isOAuthUser={isOAuthUser} />
      </div>

      <WindingPathSeparator />

      {/* Notificaciones */}
      <div>
        <NotificationSettings />
      </div>

      <WindingPathSeparator />

      {/* Eliminar cuenta */}
      <div>
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
