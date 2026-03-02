import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MasteryChart } from './MasteryChart'
import { AccuracyChart } from './AccuracyChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import type { ModuleMastery } from './MasteryChart'
import type { ExerciseAccuracy } from './AccuracyChart'
import type { DayActivity } from './ActivityHeatmap'

const MASTERED_THRESHOLD = 21  // interval_days >= this = mastered

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ── 1. Module mastery ─────────────────────────────────────────────────────
  // Fetch all concepts with their module info + user progress
  const { data: conceptRows } = await supabase
    .from('concepts')
    .select('id, unit_id, units(module_id, modules(title))')

  const { data: progressRows } = await supabase
    .from('user_progress')
    .select('concept_id, interval_days')
    .eq('user_id', user.id)

  const progressMap = new Map(
    ((progressRows ?? []) as Array<{ concept_id: string; interval_days: number }>)
      .map((p) => [p.concept_id, p.interval_days])
  )

  // Group by module
  type ModuleAgg = { mastered: number; learning: number; total: number }
  const moduleAgg = new Map<string, ModuleAgg>()

  for (const row of (conceptRows ?? []) as Array<{
    id: string
    units: { modules: { title: string } } | null
  }>) {
    const moduleTitle = row.units?.modules?.title ?? 'Unknown'
    const agg = moduleAgg.get(moduleTitle) ?? { mastered: 0, learning: 0, total: 0 }
    agg.total += 1
    const interval = progressMap.get(row.id) ?? 0
    if (interval >= MASTERED_THRESHOLD) agg.mastered += 1
    else if (interval > 0) agg.learning += 1
    moduleAgg.set(moduleTitle, agg)
  }

  const moduleMastery: ModuleMastery[] = Array.from(moduleAgg.entries()).map(
    ([module, agg]) => ({ module, ...agg })
  )

  const totalConcepts = moduleMastery.reduce((s, m) => s + m.total, 0)
  const totalMastered = moduleMastery.reduce((s, m) => s + m.mastered, 0)
  const totalLearning = moduleMastery.reduce((s, m) => s + m.learning, 0)

  // ── 2. Accuracy by exercise type ──────────────────────────────────────────
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
  const overallAccuracy = totalAttempts > 0
    ? Math.round(exerciseAccuracy.reduce((s, e) => s + e.accuracy * e.attempts, 0) / totalAttempts)
    : 0

  // ── 3. Activity heatmap (last 12 weeks) ───────────────────────────────────
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

  const hasAnyData = totalAttempts > 0

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Dashboard
        </Link>
      </div>

      {!hasAnyData ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-muted-foreground text-sm">Complete some exercises to see your progress here.</p>
          <Link href="/study" className="inline-block mt-2 underline text-sm">Start studying →</Link>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border rounded-xl p-4 space-y-1">
              <p className="text-2xl font-bold text-green-600">{totalMastered}</p>
              <p className="text-xs text-muted-foreground">Mastered</p>
            </div>
            <div className="border rounded-xl p-4 space-y-1">
              <p className="text-2xl font-bold text-blue-600">{totalLearning}</p>
              <p className="text-xs text-muted-foreground">In progress</p>
            </div>
            <div className="border rounded-xl p-4 space-y-1">
              <p className="text-2xl font-bold">{overallAccuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
          </div>

          {/* Module mastery */}
          <section className="space-y-3">
            <h2 className="font-semibold">Module mastery</h2>
            <MasteryChart data={moduleMastery} />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Mastered (≥21 day interval)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Learning</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 inline-block" /> Not started</span>
            </div>
          </section>

          {/* Accuracy by exercise type */}
          {exerciseAccuracy.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold">Accuracy by exercise type</h2>
              <AccuracyChart data={exerciseAccuracy} />
              <p className="text-xs text-muted-foreground">{totalAttempts} total attempts</p>
            </section>
          )}

          {/* Activity heatmap */}
          <section className="space-y-3">
            <h2 className="font-semibold">Activity — last 12 weeks</h2>
            <div className="overflow-x-auto">
              <ActivityHeatmap data={activityData} weeks={14} />
            </div>
          </section>
        </>
      )}
    </main>
  )
}
