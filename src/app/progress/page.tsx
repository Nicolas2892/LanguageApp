import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WeeklyActivityChart } from './WeeklyActivityChart'
import { AnimatedBar } from '@/components/AnimatedBar'
import { VerbTenseMastery } from '@/components/verbs/VerbTenseMastery'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { userLocalToday, utcToLocalDate } from '@/lib/timezone'
import { EmptyState } from '@/components/EmptyState'
import type { WeekData } from './WeeklyActivityChart'
import type { TenseSummary } from '@/components/verbs/VerbTenseMastery'

const CEFR_COLORS: Record<string, { barStyle: React.CSSProperties }> = {
  B1: { barStyle: { background: 'var(--d5-muted)' } },
  B2: { barStyle: { background: 'var(--d5-terracotta)' } },
  C1: { barStyle: { background: 'var(--d5-warm)' } },
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ── 1. Profile (streak + computed level) ──────────────────────────────────
  const { data: profileData } = await supabase
    .from('profiles')
    .select('streak, computed_level, timezone')
    .eq('id', user.id)
    .single()

  const profile = profileData as { streak: number; computed_level: string; timezone: string | null } | null
  const currentStreak = profile?.streak ?? 0
  const computedLevel = profile?.computed_level ?? 'B1'
  const userTz = profile?.timezone ?? null

  // ── 2. All data queries in parallel (Item 11: merge stages 2–6) ──────────
  const fourteenWeeksAgo = new Date()
  fourteenWeeksAgo.setDate(fourteenWeeksAgo.getDate() - 98)

  const todayStr = userLocalToday(userTz)
  const monthStart = new Date(todayStr + 'T00:00:00Z')
  monthStart.setUTCDate(1)

  const [
    { data: conceptRows },
    { data: progressRows },
    { data: accuracyData },
    { data: activityRows },
    { data: sessionRows },
    { data: verbProgressRows },
  ] = await Promise.all([
    supabase.from('concepts').select('id, level'),
    supabase.from('user_progress')
      .select('concept_id, interval_days, production_mastered')
      .eq('user_id', user.id),
    supabase.rpc('get_accuracy_by_type', { p_user_id: user.id }),
    supabase
      .from('exercise_attempts')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', fourteenWeeksAgo.toISOString()),
    supabase
      .from('study_sessions')
      .select('started_at, ended_at')
      .eq('user_id', user.id)
      .gte('started_at', monthStart.toISOString()),
    supabase
      .from('verb_progress')
      .select('tense, attempt_count, correct_count')
      .eq('user_id', user.id)
      .gt('attempt_count', 0),
  ])

  // ── CEFR Journey ──────────────────────────────────────────────────────────
  type ConceptRow = { id: string; level: string }
  type ProgressRow = { concept_id: string; interval_days: number; production_mastered: boolean }

  const conceptLevelMap = new Map(
    (conceptRows as ConceptRow[] ?? []).map((c) => [c.id, c.level])
  )

  const totalByLevel = new Map<string, number>()
  for (const c of (conceptRows as ConceptRow[] ?? [])) {
    totalByLevel.set(c.level, (totalByLevel.get(c.level) ?? 0) + 1)
  }

  const masteredByLevel = new Map<string, number>()
  let totalMastered = 0

  for (const row of (progressRows as ProgressRow[] ?? [])) {
    const level = conceptLevelMap.get(row.concept_id)
    if (!level) continue
    if (row.interval_days >= MASTERY_THRESHOLD && row.production_mastered) {
      masteredByLevel.set(level, (masteredByLevel.get(level) ?? 0) + 1)
      totalMastered++
    }
  }

  const totalConcepts = (conceptRows ?? []).length

  const CEFR_LEVELS = ['B1', 'B2', 'C1'] as const
  const cefrData = CEFR_LEVELS.map((level) => ({
    level,
    mastered: masteredByLevel.get(level) ?? 0,
    total: totalByLevel.get(level) ?? 0,
  }))

  // ── Accuracy (overall) — from RPC aggregate ──────────────────────────────
  type AccuracyRow = { exercise_type: string; total_attempts: number; correct_count: number }
  const accuracyRows = (accuracyData ?? []) as AccuracyRow[]
  const totalRow = accuracyRows.find(r => r.exercise_type === '_total')
  const totalAttempts = totalRow?.total_attempts ?? 0
  const overallAccuracy = totalAttempts > 0
    ? Math.round(((totalRow?.correct_count ?? 0) / totalAttempts) * 100)
    : 0

  // ── Weekly activity chart (last 14 weeks) ─────────────────────────────────
  const activityByDate = new Map<string, number>()
  for (const row of (activityRows ?? []) as Array<{ created_at: string }>) {
    const date = utcToLocalDate(row.created_at, userTz)
    activityByDate.set(date, (activityByDate.get(date) ?? 0) + 1)
  }
  const uniqueDaysStudied = activityByDate.size

  // Build 14 weeks of data (Monday-aligned, using user's local today)
  const today = new Date(todayStr + 'T00:00:00Z')
  const dayOfWeek = today.getUTCDay() // 0=Sun
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const thisMonday = new Date(today)
  thisMonday.setUTCDate(today.getUTCDate() - daysSinceMonday)

  const weeklyData: WeekData[] = []
  for (let w = 13; w >= 0; w--) {
    const weekStart = new Date(thisMonday)
    weekStart.setUTCDate(thisMonday.getUTCDate() - w * 7)
    const weekStartIso = weekStart.toISOString().split('T')[0]

    let weekCount = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setUTCDate(weekStart.getUTCDate() + d)
      const iso = date.toISOString().split('T')[0]
      weekCount += activityByDate.get(iso) ?? 0
    }

    weeklyData.push({ weekStart: weekStartIso, count: weekCount })
  }

  // ── Study sessions this month ─────────────────────────────────────────────
  type SessionRow = { started_at: string; ended_at: string | null }
  const sessionCount = (sessionRows ?? []).length
  const totalMinutes = (sessionRows ?? [] as SessionRow[]).reduce((sum, s) => {
    if (!s.ended_at) return sum
    const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    return sum + Math.round(ms / 60000)
  }, 0)

  type VerbProgressRow = { tense: string; attempt_count: number; correct_count: number }
  const verbTenseMap = new Map<string, { correct: number; attempts: number }>()
  for (const row of (verbProgressRows as VerbProgressRow[] ?? [])) {
    const entry = verbTenseMap.get(row.tense) ?? { correct: 0, attempts: 0 }
    entry.attempts += row.attempt_count
    entry.correct  += row.correct_count
    verbTenseMap.set(row.tense, entry)
  }

  const verbTenseSummaries: TenseSummary[] = Array.from(verbTenseMap.entries())
    .map(([tense, { correct, attempts }]) => ({
      tense,
      correct,
      attempts,
      pct: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct)  // worst first

  const hasAnyData = totalAttempts > 0

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-8 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 relative overflow-hidden animate-page-in">
      {/* BackgroundMagicS watermark */}
      <div style={{ position: 'absolute', top: '15%', right: -20, opacity: 0.05, pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        <BackgroundMagicS opacity={1} />
      </div>

      {/* All content above watermark */}
      <div style={{ position: 'relative', zIndex: 1 }} className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="senda-heading text-2xl">
            Tu Progreso
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--d5-warm)' }}>
            Nivel {computedLevel} · {totalAttempts} ejercicios
          </p>
        </div>

        {!hasAnyData ? (
          <EmptyState
            heading="Tu Camino Está Despejado."
            subtext="Completa Tu Primera Sesión Y Tu Progreso Tomará Forma Aquí."
            ctaLabel="Empezar Tu Primera Sesión"
            ctaHref="/study/configure"
          />
        ) : (
          <>
            <WindingPathSeparator />

            {/* Stats row — 3-col grid */}
            <div className="grid grid-cols-3 gap-3">

              {/* Streak */}
              <div className="senda-card-sm text-center">
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--d5-terracotta)', lineHeight: 1.2 }}>{currentStreak}</p>
                <p style={{ fontSize: 9, color: 'var(--d5-muted)', marginTop: 2, lineHeight: 1.3 }}>
                  días{'\n'}seguidos
                </p>
              </div>

              {/* Mastered */}
              <div className="senda-card-sm text-center">
                <p className="text-foreground" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{totalMastered}</p>
                <p style={{ fontSize: 9, color: 'var(--d5-muted)', marginTop: 2, lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                  {`de ${totalConcepts}\ndominados`}
                </p>
              </div>

              {/* Accuracy */}
              <div className="senda-card-sm text-center">
                <p className="text-foreground" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{overallAccuracy}%</p>
                <p style={{ fontSize: 9, color: 'var(--d5-muted)', marginTop: 2, lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                  {`precisión\nglobal`}
                </p>
              </div>
            </div>

            <WindingPathSeparator />

            {/* CEFR Level Journey */}
            <section className="space-y-4 px-1">
              <p className="senda-eyebrow" style={{ color: 'var(--d5-muted)' }}>Tu Camino CEFR</p>

              <div className="space-y-5">
                {cefrData.map(({ level, mastered, total }) => {
                  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
                  const color = CEFR_COLORS[level]
                  return (
                    <div key={level} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{level}</span>
                        <span className="text-muted-foreground">
                          {mastered} / {total} dominados
                        </span>
                      </div>
                      <div className="relative h-1 w-full rounded-full overflow-hidden" style={{ background: 'color-mix(in oklch, var(--d5-muted) 20%, transparent)' }}>
                        <AnimatedBar pct={pct} style={color?.barStyle} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <WindingPathSeparator />

            {/* Verb conjugation mastery */}
            <VerbTenseMastery summaries={verbTenseSummaries} />

            <WindingPathSeparator />

            {/* Study consistency */}
            <WeeklyActivityChart
              data={weeklyData}
              sessionCount={sessionCount}
              totalMinutes={totalMinutes}
              uniqueDaysStudied={uniqueDaysStudied}
            />

            {/* Footer */}
            <p
              className="text-center pt-4"
              style={{
                fontFamily: 'var(--font-lora), serif',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'color-mix(in oklch, var(--d5-ink) 25%, transparent)',
              }}
            >
              tu senda continúa…
            </p>
          </>
        )}
      </div>
    </main>
  )
}
