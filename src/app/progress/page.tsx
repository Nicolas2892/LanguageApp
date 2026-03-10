import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccuracyChart } from './AccuracyChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import { AnimatedBar } from '@/components/AnimatedBar'
import { ExerciseTypeChart } from '@/components/ExerciseTypeChart'
import { VerbTenseMastery } from '@/components/verbs/VerbTenseMastery'
import { VerbTenseChart } from '@/components/verbs/VerbTenseChart'
import { MASTERY_THRESHOLD, LEVEL_CHIP } from '@/lib/constants'
import { Flame, CheckCircle, Zap, Target, BarChart2, ListChecks, Clock } from 'lucide-react'
import type { ExerciseAccuracy } from './AccuracyChart'
import type { DayActivity } from './ActivityHeatmap'
import type { ExerciseTypeCount } from '@/components/ExerciseTypeChart'
import type { TenseSummary } from '@/components/verbs/VerbTenseMastery'

const TYPE_LABELS: Record<string, string> = {
  gap_fill: 'Gap fill',
  translation: 'Translation',
  transformation: 'Transformation',
  error_correction: 'Error correction',
  free_write: 'Free write',
  sentence_builder: 'Sentence builder',
}

const CEFR_COLORS: Record<string, { bar: string; text: string }> = {
  B1: { bar: 'bg-green-500',  text: 'text-green-700 dark:text-green-400'  },
  B2: { bar: 'bg-amber-500',  text: 'text-amber-700 dark:text-amber-400'  },
  C1: { bar: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400' },
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ── 1. Profile (streak + computed level) ──────────────────────────────────
  const { data: profileData } = await supabase
    .from('profiles')
    .select('streak, computed_level')
    .eq('id', user.id)
    .single()

  const profile = profileData as { streak: number; computed_level: string } | null
  const currentStreak = profile?.streak ?? 0
  const computedLevel = profile?.computed_level ?? 'B1'

  // ── 2. CEFR Journey ───────────────────────────────────────────────────────
  const [{ data: conceptRows }, { data: progressRows }] = await Promise.all([
    supabase.from('concepts').select('id, level'),
    supabase.from('user_progress')
      .select('concept_id, interval_days, production_mastered')
      .eq('user_id', user.id),
  ])

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
  const productionByLevel = new Map<string, number>()
  let totalMastered = 0

  for (const row of (progressRows as ProgressRow[] ?? [])) {
    const level = conceptLevelMap.get(row.concept_id)
    if (!level) continue
    if (row.interval_days >= MASTERY_THRESHOLD) {
      masteredByLevel.set(level, (masteredByLevel.get(level) ?? 0) + 1)
      totalMastered++
    }
    if (row.production_mastered) {
      productionByLevel.set(level, (productionByLevel.get(level) ?? 0) + 1)
    }
  }

  const totalConcepts = (conceptRows ?? []).length
  const totalProductionCertified = Array.from(productionByLevel.values()).reduce(
    (s, v) => s + v,
    0
  )

  const CEFR_LEVELS = ['B1', 'B2', 'C1'] as const
  const cefrData = CEFR_LEVELS.map((level) => ({
    level,
    mastered: masteredByLevel.get(level) ?? 0,
    production: productionByLevel.get(level) ?? 0,
    total: totalByLevel.get(level) ?? 0,
  }))

  // ── 3. Accuracy by exercise type ──────────────────────────────────────────
  const { data: attemptRows } = await supabase
    .from('exercise_attempts')
    .select('ai_score, exercises(type)')
    .eq('user_id', user.id)

  type AttemptRow = { ai_score: number | null; exercises: { type: string } | null }
  const byType = new Map<string, { total: number; correct: number }>()

  for (const row of (attemptRows ?? []) as AttemptRow[]) {
    const type = row.exercises?.type ?? 'unknown'
    const agg = byType.get(type) ?? { total: 0, correct: 0 }
    agg.total += 1
    if ((row.ai_score ?? 0) >= 2) agg.correct += 1
    byType.set(type, agg)
  }

  const exerciseAccuracy: ExerciseAccuracy[] = Array.from(byType.entries())
    .filter(([, v]) => v.total >= 1)
    .map(([type, v]) => ({
      type,
      accuracy: Math.round((v.correct / v.total) * 100),
      attempts: v.total,
    }))
    .sort((a, b) => b.attempts - a.attempts)

  const totalAttempts = exerciseAccuracy.reduce((s, e) => s + e.attempts, 0)
  const overallAccuracy =
    totalAttempts > 0
      ? Math.round(
          exerciseAccuracy.reduce((s, e) => s + e.accuracy * e.attempts, 0) / totalAttempts
        )
      : 0

  // Best + worst exercise type insight
  const sortedByAccuracy = exerciseAccuracy.length >= 2
    ? [...exerciseAccuracy].sort((a, b) => b.accuracy - a.accuracy)
    : null
  const bestType = sortedByAccuracy?.[0] ?? null
  const worstType = sortedByAccuracy?.[sortedByAccuracy.length - 1] ?? null
  const showInsight = bestType && worstType && bestType.type !== worstType.type

  // ── 4. Activity heatmap (last 12 weeks) ───────────────────────────────────
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  const { data: activityRows } = await supabase
    .from('exercise_attempts')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', twelveWeeksAgo.toISOString())

  const activityByDate = new Map<string, number>()
  for (const row of (activityRows ?? []) as Array<{ created_at: string }>) {
    const date = row.created_at.split('T')[0]
    activityByDate.set(date, (activityByDate.get(date) ?? 0) + 1)
  }

  const activityData: DayActivity[] = Array.from(activityByDate.entries()).map(
    ([date, count]) => ({ date, count })
  )
  const uniqueDaysStudied = activityByDate.size

  // ── 5. Study sessions this month ──────────────────────────────────────────
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: sessionRows } = await supabase
    .from('study_sessions')
    .select('started_at, ended_at')
    .eq('user_id', user.id)
    .gte('started_at', monthStart.toISOString())

  type SessionRow = { started_at: string; ended_at: string | null }
  const sessionCount = (sessionRows ?? []).length
  const totalMinutes = (sessionRows ?? [] as SessionRow[]).reduce((sum, s) => {
    if (!s.ended_at) return sum
    const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    return sum + Math.round(ms / 60000)
  }, 0)

  // ── 6. All-time stats ──────────────────────────────────────────────────────
  const [{ count: allTimeAttemptCount }, { data: allTimeSessions }] = await Promise.all([
    supabase
      .from('exercise_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('study_sessions')
      .select('started_at, ended_at')
      .eq('user_id', user.id),
  ])

  const totalAllTimeAttempts = allTimeAttemptCount ?? 0
  const totalAllTimeMinutes = (allTimeSessions ?? [] as SessionRow[]).reduce((sum, s) => {
    if (!s.ended_at) return sum
    const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    return sum + Math.round(ms / 60000)
  }, 0)

  // Exercise type breakdown (all-time)
  const exerciseTypeCounts = new Map<string, number>()
  for (const row of (attemptRows ?? []) as Array<{ ai_score: number | null; exercises: { type: string } | null }>) {
    const type = row.exercises?.type
    if (!type) continue
    exerciseTypeCounts.set(type, (exerciseTypeCounts.get(type) ?? 0) + 1)
  }
  const exerciseTypeData: ExerciseTypeCount[] = Array.from(exerciseTypeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const hasAnyData = totalAttempts > 0

  // ── 7. Verb conjugation mastery ────────────────────────────────────────────
  const { data: verbProgressRows } = await supabase
    .from('verb_progress')
    .select('tense, attempt_count, correct_count')
    .eq('user_id', user.id)
    .gt('attempt_count', 0)

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

  // Page meta
  const now = new Date()
  const monthLabel = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()
  const levelChip = LEVEL_CHIP[computedLevel]

  // Motivating B1→B2 hint
  const b1 = cefrData.find((d) => d.level === 'B1')
  const b1Pct = b1 && b1.total > 0 ? b1.mastered / b1.total : 0
  const b1Remaining = b1 ? b1.total - b1.mastered : 0
  const showB2Hint = b1Pct >= 0.6 && b1Remaining > 0

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-8 pb-24 lg:pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your learning journey · {monthLabel} {year}
          </p>
        </div>
        {levelChip && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${levelChip.className}`}
          >
            {levelChip.label}
          </span>
        )}
      </div>

      {!hasAnyData ? (
        <div className="text-center py-16 space-y-4">
          <BarChart2 className="h-14 w-14 text-green-300 mx-auto" strokeWidth={1.5} />
          <p className="text-xl font-bold">No data yet</p>
          <p className="text-muted-foreground text-sm">
            Complete some exercises to see your progress here.
          </p>
          <Link
            href="/study"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
          >
            Start studying →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats row — 2×2 mobile / 4-col desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Streak */}
            <div className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Flame className="h-4 w-4 text-green-700 dark:text-green-400" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-extrabold">{currentStreak}</p>
              <div>
                <p className="text-xs font-medium">Day streak</p>
                <p className="text-xs text-muted-foreground">{currentStreak < 7 ? 'Building something.' : "Don't break it now."}</p>
              </div>
            </div>

            {/* Mastered */}
            <div className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{totalMastered}</p>
              <div>
                <p className="text-xs font-medium">Mastered</p>
                <p className="text-xs text-muted-foreground">of {totalConcepts} total</p>
              </div>
            </div>

            {/* Production certified */}
            <div className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{totalProductionCertified}</p>
              <div>
                <p className="text-xs font-medium">Active skills</p>
                <p className="text-xs text-muted-foreground">key skill for B2</p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">{overallAccuracy}%</p>
              <div>
                <p className="text-xs font-medium">Accuracy</p>
                <p className="text-xs text-muted-foreground">across all exercises</p>
              </div>
            </div>
          </div>

          {/* All-time stats */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">All-time</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-extrabold">{totalAllTimeAttempts.toLocaleString()}</p>
                <div>
                  <p className="text-xs font-medium">Exercises done</p>
                  <p className="text-xs text-muted-foreground">total all time</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-extrabold">
                  {totalAllTimeMinutes >= 60
                    ? `${Math.floor(totalAllTimeMinutes / 60)}h ${totalAllTimeMinutes % 60}m`
                    : `${totalAllTimeMinutes}m`}
                </p>
                <div>
                  <p className="text-xs font-medium">Learning time</p>
                  <p className="text-xs text-muted-foreground">total all time</p>
                </div>
              </div>
            </div>
          </div>

          {/* CEFR Level Journey */}
          <section className="bg-card rounded-xl border p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Level progress</h2>
              {levelChip && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelChip.className}`}
                >
                  {levelChip.label}
                </span>
              )}
            </div>

            <div className="space-y-0">
              {cefrData.map(({ level, mastered, production, total }, idx) => {
                const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
                const color = CEFR_COLORS[level]
                return (
                  <div key={level} className="relative">
                    {/* Dashed connector between levels */}
                    {idx > 0 && (
                      <div className="absolute left-2 -top-3 h-3 border-l-2 border-dashed border-border" />
                    )}
                    <div className="space-y-1.5 pt-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{level}</span>
                        <span className="text-muted-foreground">
                          {mastered} / {total} concepts
                        </span>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                        <AnimatedBar pct={pct} className={color?.bar ?? 'bg-gray-400'} />
                      </div>
                      <div className="flex justify-end">
                        <p className={`text-[11px] font-medium ${color?.text ?? ''}`}>{pct}%</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {showB2Hint && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium pt-1 border-t">
                {b1Remaining} more concept{b1Remaining !== 1 ? 's' : ''} until you unlock B2
              </p>
            )}
          </section>

          {/* Exercises by type */}
          {exerciseTypeData.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-base">Exercises by type</h2>
              <div className="bg-card rounded-xl border p-5 shadow-sm">
                <ExerciseTypeChart data={exerciseTypeData} />
              </div>
            </section>
          )}

          {/* Skill breakdown */}
          {exerciseAccuracy.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-base">Skill breakdown</h2>
              <div className="bg-card rounded-xl border p-5 shadow-sm">
                <AccuracyChart data={exerciseAccuracy} />
                {showInsight && (
                  <p className="text-xs text-muted-foreground border-t mt-3 pt-3">
                    Best:{' '}
                    <span className="font-medium text-foreground">
                      {TYPE_LABELS[bestType!.type] ?? bestType!.type}
                    </span>{' '}
                    ({bestType!.accuracy}%)&nbsp;·&nbsp;Needs work:{' '}
                    <span className="font-medium text-foreground">
                      {TYPE_LABELS[worstType!.type] ?? worstType!.type}
                    </span>{' '}
                    ({worstType!.accuracy}%)
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Study consistency */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-base">Study consistency</h2>
                {sessionCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">
                      {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                    </span>{' '}
                    this month
                    {totalMinutes > 0 && (
                      <>
                        {' '}·{' '}
                        <span className="font-medium text-foreground">
                          {(totalMinutes / 60).toFixed(1)} hrs
                        </span>{' '}
                        total
                      </>
                    )}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-right shrink-0">
                {uniqueDaysStudied} day{uniqueDaysStudied !== 1 ? 's' : ''} studied
                <br />
                <span className="text-[10px]">in the last 3 months</span>
              </p>
            </div>
            <div className="bg-card rounded-xl border p-5 shadow-sm overflow-x-auto">
              <ActivityHeatmap data={activityData} weeks={14} />
            </div>
          </section>

          {/* Verb conjugation mastery */}
          <VerbTenseMastery summaries={verbTenseSummaries} />

          {/* Verb conjugation accuracy chart */}
          {verbTenseSummaries.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-base">Verb accuracy by tense</h2>
              <div className="bg-card rounded-xl border p-5 shadow-sm">
                <VerbTenseChart summaries={verbTenseSummaries} />
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
