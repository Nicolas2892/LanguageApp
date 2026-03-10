import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AnimatedBar } from '@/components/AnimatedBar'
import { OnboardingTour } from '@/components/OnboardingTour'
import { DashboardDeferredSection, DashboardDeferredSkeleton } from '@/components/DashboardDeferredSection'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { Profile } from '@/lib/supabase/types'
import { MASTERY_THRESHOLD, LEVEL_CHIP } from '@/lib/constants'
import { BookOpen, CheckCircle2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Week boundaries (Mon–Sun)
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(now.getDate() - (dayOfWeek - 1))
  thisWeekStart.setHours(0, 0, 0, 0)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  const [profileRes, dueRes, totalConceptsRes, studiedRes, masteredRes, todaySessionsRes] = await Promise.all([
    supabase.from('profiles').select('streak, computed_level, display_name, daily_goal_minutes, last_studied_date').eq('id', user.id).single(),
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
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('interval_days', MASTERY_THRESHOLD),
    supabase
      .from('study_sessions')
      .select('started_at, ended_at')
      .eq('user_id', user.id)
      .gte('started_at', todayStart.toISOString()),
  ])

  const profile = profileRes.data as Profile | null
  const dueCount = dueRes.count ?? 0
  const totalConcepts = totalConceptsRes.count ?? 0
  const studiedCount = studiedRes.count ?? 0
  const masteredCount = masteredRes.count ?? 0
  const newConceptsCount = totalConcepts - studiedCount
  const learningCount = studiedCount - masteredCount
  const isNewUser = studiedCount === 0

  type SessionRow = { started_at: string; ended_at: string | null }
  const todayMinutes = (todaySessionsRes.data ?? [] as SessionRow[]).reduce((sum, s) => {
    if (!s.ended_at) return sum
    return sum + Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
  }, 0)
  const dailyGoalMinutes = profile?.daily_goal_minutes ?? 0
  const goalPct = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0
  const goalMet = dailyGoalMinutes > 0 && todayMinutes >= dailyGoalMinutes

  const masteredPct = totalConcepts > 0 ? (masteredCount / totalConcepts) * 100 : 0
  const learningPct = totalConcepts > 0 ? (learningCount / totalConcepts) * 100 : 0

  const streak = profile?.streak ?? 0
  const streakSubtext = (() => {
    if (dueCount === 0 && studiedCount > 0) return 'Todo al día en tu senda hoy.'
    if (streak >= 30) return '30 días seguidos — eres imparable.'
    if (streak >= 7) return '7 días seguidos — estás creando un hábito real.'
    if (streak === 1) return 'Día 1 — el paso más difícil ya está hecho.'
    if (streak === 0) return '¿Listo para empezar tu racha?'
    return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  })()

  return (
    <main className="max-w-lg mx-auto px-5 pt-5 pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:px-8 lg:pt-8 lg:pb-8">

      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), serif',
              fontStyle: 'italic',
              fontSize: 28,
              lineHeight: 1.15,
              color: 'var(--d5-ink)',
            }}
          >
            Hola, {profile?.display_name ?? 'learner'}.
          </h1>
          {profile?.computed_level && (() => {
            const chip = LEVEL_CHIP[profile.computed_level]
            return chip ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${chip.className}`}>
                Nivel {chip.label}
              </span>
            ) : null
          })()}
        </div>
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
          {streakSubtext}
        </p>
      </div>

      <WindingPathSeparator />

      {/* ── Tu Senda Diaria — SRS review card ──────────────────────────────── */}
      <div className="senda-card space-y-3">
        <div className="flex items-center justify-between">
          <p className="senda-eyebrow">Tu Senda Diaria</p>
          {studiedCount > 0 && dueCount === 0
            ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--d5-terracotta)' }} strokeWidth={1.5} />
            : <BookOpen className="h-4 w-4 shrink-0" style={{ color: 'var(--d5-muted)' }} strokeWidth={1.5} />
          }
        </div>

        {studiedCount === 0 ? (
          <>
            <p
              style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 16, lineHeight: 1.4, color: 'var(--d5-ink)' }}
            >
              Sin repasos aún
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
              Completa tu primera sesión y lo seguiremos desde aquí.
            </p>
          </>
        ) : dueCount > 0 ? (
          <>
            <p
              style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 16, lineHeight: 1.4, color: 'var(--d5-ink)' }}
            >
              {dueCount} Concepto{dueCount !== 1 ? 's' : ''} esperan tu repaso
              {dueCount >= 10 && (
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse ml-2 align-middle" />
              )}
            </p>
            <Button asChild className="w-full rounded-full font-bold" style={{ background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', border: 'none' }}>
              <Link href="/study">Empezar Repaso →</Link>
            </Button>
          </>
        ) : (
          <>
            <p
              style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 16, lineHeight: 1.4, color: 'var(--d5-ink)' }}
            >
              Todo al día en tu senda hoy
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
              Perfecto — vuelve mañana o explora a tu ritmo.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full"
              style={{ borderColor: 'var(--d5-terracotta)', color: 'var(--d5-terracotta)' }}
            >
              <Link href="/study/configure?mode=practice">Practicar De Todos Modos →</Link>
            </Button>
          </>
        )}
      </div>

      <WindingPathSeparator />

      {/* ── Tu Progreso — streak + mastery stats ───────────────────────────── */}
      {!isNewUser && (
        <>
          <div className="senda-card space-y-3">
            <p className="senda-eyebrow">Tu Progreso</p>
            {/* Stats row */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-extrabold leading-none" style={{ color: 'var(--d5-terracotta)' }}>
                  {streak}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--d5-warm)' }}>Días Seguidos</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none" style={{ color: 'var(--d5-ink)' }}>
                  {masteredCount}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--d5-warm)' }}>De {totalConcepts} Dominados</p>
              </div>
            </div>

            {/* Curriculum progress bar */}
            <div className="space-y-1.5">
              <div className="flex h-2 rounded-full overflow-hidden gap-px" style={{ background: 'rgba(184,170,153,0.2)' }}>
                <AnimatedBar pct={masteredPct} className="bg-primary rounded-l-full" />
                <AnimatedBar pct={learningPct} className="bg-amber-300" />
              </div>
              <p className="text-[10px] text-right" style={{ color: 'var(--d5-muted)' }}>
                {masteredCount} Dominados · {learningCount} En Progreso · {newConceptsCount} Por Empezar
              </p>
            </div>

            {/* Daily goal */}
            {dailyGoalMinutes > 0 && (
              <div className="space-y-1 pt-2" style={{ borderTop: '1px solid rgba(184,170,153,0.25)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px]" style={{ color: 'var(--d5-warm)' }}>
                    {goalMet ? '✓ ¡Meta Diaria Cumplida!' : 'Meta Diaria'}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: goalMet ? 'var(--d5-terracotta)' : 'var(--d5-ink)' }}>
                    {todayMinutes} / {dailyGoalMinutes} min
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(184,170,153,0.2)' }}>
                  <AnimatedBar pct={goalPct} className="bg-primary" />
                </div>
              </div>
            )}
          </div>
          <WindingPathSeparator />
        </>
      )}

      {/* ── Exploración Abierta — open practice + BackgroundMagicS ─────────── */}
      {newConceptsCount > 0 && (
        <>
          <div
            className="relative overflow-hidden rounded-[20px] space-y-3"
            style={{ padding: '16px 18px', minHeight: 130 }}
          >
            <BackgroundMagicS />
            <div className="relative z-10 space-y-3">
              <p className="senda-eyebrow">Exploración Abierta</p>
              <p
                style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 16, lineHeight: 1.4, color: 'var(--d5-ink)' }}
              >
                {newConceptsCount} Concepto{newConceptsCount !== 1 ? 's' : ''} esperándote
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--d5-warm)' }}>
                Continúa tu camino con práctica libre.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full"
                style={{ borderColor: 'var(--d5-terracotta)', color: 'var(--d5-terracotta)' }}
              >
                <Link href="/study?mode=new">Empezar A Aprender →</Link>
              </Button>
            </div>
          </div>
          <WindingPathSeparator />
        </>
      )}

      {/* ── Deferred section (Escritura Libre · Revisar Errores · Snapshot) ── */}
      <Suspense fallback={<DashboardDeferredSkeleton />}>
        <DashboardDeferredSection
          userId={user.id}
          isNewUser={isNewUser}
          thisWeekStart={thisWeekStart.toISOString()}
          lastWeekStart={lastWeekStart.toISOString()}
        />
      </Suspense>

      <OnboardingTour />
    </main>
  )
}
