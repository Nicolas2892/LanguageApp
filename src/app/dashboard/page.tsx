import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { OnboardingTour } from '@/components/OnboardingTour'
import { DashboardDeferredSection, DashboardDeferredSkeleton } from '@/components/DashboardDeferredSection'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { Profile } from '@/lib/supabase/types'
import { LEVEL_CHIP } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  // Week boundaries (Mon–Sun)
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(now.getDate() - (dayOfWeek - 1))
  thisWeekStart.setHours(0, 0, 0, 0)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  const [profileRes, dueRes, totalConceptsRes, studiedRes] = await Promise.all([
    supabase.from('profiles').select('computed_level, display_name').eq('id', user.id).single(),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('due_date', today),
    supabase
      .from('concepts')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data as Profile | null
  const dueCount = dueRes.count ?? 0
  const totalConcepts = totalConceptsRes.count ?? 0
  const studiedCount = studiedRes.count ?? 0
  const newConceptsCount = totalConcepts - studiedCount
  const isNewUser = studiedCount === 0

  return (
    <main className="max-w-lg mx-auto px-5 pt-5 pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:px-8 lg:pt-8 lg:pb-8">

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
      </div>

      <WindingPathSeparator />

      {/* ── Tu Senda Diaria — SRS review card ──────────────────────────────── */}
      <div className="senda-card space-y-3 mt-2">
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
            <p className="text-xs leading-relaxed">
              <span className="font-bold text-foreground">{dueCount}</span>
              {' '}<span style={{ color: 'var(--d5-warm)' }}>Listo{dueCount !== 1 ? 's' : ''}</span>
              <span style={{ color: 'var(--d5-muted)' }}> · </span>
              <span className="font-bold text-foreground">{newConceptsCount}</span>
              {' '}<span style={{ color: 'var(--d5-warm)' }}>Esperando</span>
            </p>
            <Button asChild className="w-full rounded-full font-bold" style={{ background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', border: 'none' }}>
              <Link href="/study">Empezar Repaso</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="senda-heading text-base">
              Todo al día en tu senda hoy
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
              Perfecto — vuelve mañana o explora a tu ritmo.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full"
              style={{ borderColor: 'var(--d5-terracotta)', color: 'var(--d5-terracotta)' }}
            >
              <Link href="/study/configure?mode=practice">Practicar De Todos Modos</Link>
            </Button>
          </>
        )}
      </div>

      {/* ── Card stack wrapper — BackgroundMagicS threads behind all three cards ── */}
      <div className="relative overflow-hidden mt-2">
        <BackgroundMagicS style={{ left: -20, top: 20, right: 'auto', width: 280, height: 360 }} />

        <WindingPathSeparator />

        {/* ── Exploración Abierta — open practice ─────────────────────────────── */}
        {newConceptsCount > 0 && (
          <>
            <div className="senda-card space-y-3">
              <p className="senda-eyebrow">Exploración Abierta</p>
              <p className="senda-heading text-base">
                Tu Práctica: {newConceptsCount} Concepto{newConceptsCount !== 1 ? 's' : ''} Esperándote
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
                Continúa tu camino con práctica libre.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full"
                style={{ borderColor: 'var(--d5-terracotta)', color: 'var(--d5-terracotta)' }}
              >
                <Link href="/study?mode=new">Ir a Práctica Abierta</Link>
              </Button>
            </div>
            <WindingPathSeparator />
          </>
        )}

        {/* ── Deferred section (Escritura Libre · Revisar Errores · Snapshot · Currículo) ── */}
        <Suspense fallback={<DashboardDeferredSkeleton />}>
          <DashboardDeferredSection
            userId={user.id}
            isNewUser={isNewUser}
            thisWeekStart={thisWeekStart.toISOString()}
            lastWeekStart={lastWeekStart.toISOString()}
          />
        </Suspense>
      </div>

      <OnboardingTour />
    </main>
  )
}
