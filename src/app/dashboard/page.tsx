import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AnimatedBar } from '@/components/AnimatedBar'
import { OnboardingTour } from '@/components/OnboardingTour'
import { DashboardDeferredSection, DashboardDeferredSkeleton } from '@/components/DashboardDeferredSection'
import type { Profile } from '@/lib/supabase/types'
import { MASTERY_THRESHOLD, LEVEL_CHIP } from '@/lib/constants'
import {
  Flame, Trophy, BookOpen, Sparkles, CheckCircle2,
} from 'lucide-react'

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

  return (
    <main className="max-w-lg mx-auto p-6 md:p-8 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-8">
      {/* Greeting + level badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {profile?.display_name ?? 'learner'}
          </h1>
          {profile?.computed_level && (() => {
            const chip = LEVEL_CHIP[profile.computed_level]
            return chip ? (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${chip.className}`}>
                {chip.label}
              </span>
            ) : null
          })()}
        </div>
        <div className="h-px w-16 bg-gradient-to-r from-primary to-transparent mt-1" />
        <p className="text-muted-foreground text-sm">
          {(() => {
            const streak = profile?.streak ?? 0
            if (dueCount === 0 && studiedCount > 0) return 'Todo Al Día — Buen Momento Para Aprender Algo Nuevo.'
            if (streak >= 30) return '30 Días Seguidos — Eres Imparable.'
            if (streak >= 7) return '7 Días Seguidos — Estás Creando Un Hábito Real.'
            if (streak === 1) return 'Día 1 — El Paso Más Difícil Ya Está Hecho.'
            if (streak === 0) return '¿Listo Para Empezar Tu Racha?'
            return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
          })()}
        </p>
      </div>

      {/* Stats + progress — unified status card */}
      <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className={`h-5 w-5 shrink-0 ${(profile?.streak ?? 0) >= 7 ? 'text-primary animate-pulse' : 'text-primary'}`} strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-extrabold text-primary leading-none">{profile?.streak ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Días Seguidos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-extrabold leading-none">{masteredCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">De {totalConcepts} Dominados</p>
            </div>
          </div>
        </div>

        {/* Progress bar — only for non-new users */}
        {!isNewUser && (
          <div className="space-y-1.5">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted gap-0.5">
              <AnimatedBar pct={masteredPct} className="bg-primary rounded-l-full" />
              <AnimatedBar pct={learningPct} className="bg-amber-300" />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {masteredCount} Dominados · {learningCount} En Progreso · {newConceptsCount} Por Empezar
            </p>
          </div>
        )}

        {/* Daily goal progress */}
        {dailyGoalMinutes > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/40">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {goalMet ? '✓ ¡Meta Diaria Cumplida!' : 'Meta Diaria'}
              </span>
              <span className={`font-medium ${goalMet ? 'text-primary' : 'text-foreground'}`}>
                {todayMinutes} / {dailyGoalMinutes} min
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <AnimatedBar pct={goalPct} className="bg-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div className="space-y-3">
        {/* Review card — primary emphasis when action is needed */}
        {(() => {
          const reviewCardIsDue = dueCount > 0 && studiedCount > 0
          return (
            <div className={`rounded-xl p-6 space-y-3 border ${
              reviewCardIsDue
                ? 'bg-primary text-primary-foreground border-primary'
                : studiedCount > 0 && dueCount === 0
                ? 'border-l-4 border-l-primary/50 border-primary/20 bg-card'
                : 'border-l-4 border-l-primary bg-card'
            }`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-widest ${reviewCardIsDue ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Tu Senda Diaria</p>
                {studiedCount > 0 && dueCount === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
                ) : (
                  <BookOpen className={`h-5 w-5 ${reviewCardIsDue ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                )}
              </div>
              {studiedCount === 0 ? (
                <>
                  <p className="text-xl font-bold">Sin Repasos Aún</p>
                  <p className="text-muted-foreground text-sm">Completa Tu Primera Sesión Y Lo Seguiremos Desde Aquí.</p>
                </>
              ) : dueCount > 0 ? (
                <>
                  <p className="text-xl font-bold flex items-center gap-2">
                    {dueCount} Concepto{dueCount !== 1 ? 's' : ''} Esperan Tu Repaso
                    {dueCount >= 10 && (
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </p>
                  <Button asChild variant={reviewCardIsDue ? 'secondary' : 'default'} className="w-full rounded-full active:scale-95 transition-transform">
                    <Link href="/study">Empezar Repaso →</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold">Todo Al Día En Tu Senda Hoy</p>
                  <p className="text-muted-foreground text-sm">Perfecto — Vuelve Mañana O Explora A Tu Ritmo.</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/study/configure?mode=practice">Practicar De Todos Modos →</Link>
                  </Button>
                </>
              )}
            </div>
          )
        })()}

        {/* Learn new card */}
        {newConceptsCount > 0 && (
          <div className="border border-l-4 border-l-primary rounded-xl p-6 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Aprender Nuevo</p>
              <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-xl font-bold">
              {newConceptsCount} Concepto{newConceptsCount !== 1 ? 's' : ''} Esperando
            </p>
            <Button asChild className="w-full rounded-full active:scale-95 transition-transform">
              <Link href="/study?mode=new">Empezar A Aprender →</Link>
            </Button>
          </div>
        )}

        {/* Deferred section — streams in after primary cards */}
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
