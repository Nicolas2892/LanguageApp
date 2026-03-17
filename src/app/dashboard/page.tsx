import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCached } from '@/lib/cache'
import { OnboardingTour } from '@/components/OnboardingTour'
import { DashboardDeferredSection, DashboardDeferredSkeleton } from '@/components/DashboardDeferredSection'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { StreakMilestone } from '@/components/StreakMilestone'
import { StreakFreezeNotification } from '@/components/StreakFreezeNotification'
import { StreakFreezeStatus } from '@/components/StreakFreezeStatus'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import type { Profile } from '@/lib/supabase/types'
import { LEVEL_CHIP } from '@/lib/constants'
import { userLocalToday } from '@/lib/timezone'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Item 10: Parallelise profile fetch with timezone-independent queries
  const [{ data: profileRaw }, totalConcepts, studiedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('computed_level, display_name, streak, timezone, streak_freeze_remaining, streak_freeze_used_date')
      .eq('id', user.id)
      .single(),
    getCached('curriculum:concept-count', async () => {
      const { count } = await supabase.from('concepts').select('id', { count: 'exact', head: true })
      return count ?? 0
    }),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])
  const profile = profileRaw as Profile | null
  const today = userLocalToday(profile?.timezone)

  // Due count query needs timezone (for today's date), so runs after profile fetch
  const dueRes = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due_date', today)

  const dueCount = dueRes.count ?? 0
  const studiedCount = studiedRes.count ?? 0
  const newConceptsCount = totalConcepts - studiedCount
  const isNewUser = studiedCount === 0

  return (
    <main className="max-w-2xl mx-auto px-5 pt-5 pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:px-8 lg:pt-8 lg:pb-8 animate-page-in">

      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <h1 className="senda-heading text-2xl mb-2">
          Hola, {(profile?.display_name ?? 'learner').split(' ')[0]}.
        </h1>
        {profile?.computed_level && (() => {
          const chip = LEVEL_CHIP[profile.computed_level]
          return chip ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${chip.className}`}>
              Nivel {chip.label}
            </span>
          ) : null
        })()}
        <StreakFreezeStatus
          streak={profile?.streak ?? 0}
          freezeRemaining={profile?.streak_freeze_remaining ?? 0}
        />
      </div>

      <WindingPathSeparator />

      {/* ── Tu Senda Diaria — SRS review card ──────────────────────────────── */}
      <div className="senda-card animate-card-in space-y-3 mt-4" style={{ animationDelay: '0ms' }}>
        <p className="senda-eyebrow">Tu Senda Diaria</p>

        {studiedCount === 0 ? (
          <>
            <p className="senda-heading text-base">
              Sin repasos aún
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
              Completa tu primera sesión y lo seguiremos desde aquí.
            </p>
          </>
        ) : dueCount > 0 ? (
          <>
            <p className="senda-heading text-base">
              {dueCount} Concepto{dueCount !== 1 ? 's' : ''} listos para repasar
              {dueCount >= 10 && (
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--d5-terracotta)] animate-senda-pulse ml-2 align-middle" />
              )}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
              {dueCount} Listo{dueCount !== 1 ? 's' : ''}
              <span style={{ color: 'var(--d5-muted)' }}> · </span>
              {newConceptsCount} Esperando
            </p>
            <Link href="/study" className="senda-cta w-full">
              Empezar Repaso
            </Link>
          </>
        ) : (
          <>
            <p className="senda-heading text-base">
              Todo al día en tu senda hoy
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
              Perfecto — vuelve mañana o explora a tu ritmo.
            </p>
            <Link href="/study/configure?mode=practice" className="senda-cta-outline w-full">
              Practicar De Todos Modos
            </Link>
          </>
        )}
      </div>

      {/* ── Card stack wrapper — BackgroundMagicS threads behind all three cards ── */}
      <div className="relative mt-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <BackgroundMagicS style={{ left: '-1.25rem', top: '1.25rem', right: 'auto', width: '17.5rem', height: '22.5rem' }} />
        </div>

        <WindingPathSeparator />

        {/* ── Exploración Abierta — open practice ─────────────────────────────── */}
        {newConceptsCount > 0 && (
          <>
            <div className="senda-card animate-card-in space-y-3" style={{ animationDelay: '60ms' }}>
              <p className="senda-eyebrow">Exploración Abierta</p>
              <p className="senda-heading text-base">
                Tu Práctica: {newConceptsCount} Concepto{newConceptsCount !== 1 ? 's' : ''} Esperándote
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
                Continúa tu camino con práctica libre.
              </p>
              <Link href="/study?mode=new" className="senda-cta-outline w-full">
                Ir a Práctica Abierta
              </Link>
            </div>
            <WindingPathSeparator />
          </>
        )}

        {/* ── Deferred section (Escritura Libre · Revisar Errores · Snapshot · Currículo) ── */}
        <Suspense fallback={<DashboardDeferredSkeleton />}>
          <DashboardDeferredSection
            userId={user.id}
            isNewUser={isNewUser}
          />
        </Suspense>
      </div>

      <OnboardingTour />
      <StreakMilestone streak={profile?.streak ?? 0} />
      <StreakFreezeNotification
        freezeUsedDate={profile?.streak_freeze_used_date ?? null}
        streak={profile?.streak ?? 0}
      />
      <LevelUpOverlay currentLevel={profile?.computed_level ?? null} />
    </main>
  )
}
