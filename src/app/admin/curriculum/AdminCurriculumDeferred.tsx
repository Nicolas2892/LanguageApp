import { createServiceClient } from '@/lib/supabase/service'
import { MASTERY_THRESHOLD } from '@/lib/constants'

interface Props {
  conceptIds: string[]
}

interface ConceptStats {
  exerciseCount: number
  attemptCount: number
  avgScore: number | null
  masteredUsers: number
}

export async function AdminCurriculumDeferred({ conceptIds }: Props) {
  if (conceptIds.length === 0) return null

  const service = createServiceClient()

  const [exercisesRes, attemptsRes, progressRes] = await Promise.all([
    service.from('exercises').select('id, concept_id').in('concept_id', conceptIds),
    service
      .from('exercise_attempts')
      .select('exercise_id, ai_score'),
    service
      .from('user_progress')
      .select('concept_id, interval_days')
      .in('concept_id', conceptIds)
      .gte('interval_days', MASTERY_THRESHOLD),
  ])

  type ExerciseRow = { id: string; concept_id: string }
  type AttemptRow  = { exercise_id: string | null; ai_score: number | null }
  type ProgressRow = { concept_id: string; interval_days: number }

  const exercises = (exercisesRes.data ?? []) as ExerciseRow[]
  const attempts  = (attemptsRes.data  ?? []) as AttemptRow[]
  const progress  = (progressRes.data  ?? []) as ProgressRow[]

  // Build exercise → concept lookup
  const conceptByExercise = new Map<string, string>()
  for (const ex of exercises) {
    conceptByExercise.set(ex.id, ex.concept_id)
  }

  // exercise count per concept
  const exercisesByConceptId = new Map<string, number>()
  for (const ex of exercises) {
    exercisesByConceptId.set(ex.concept_id, (exercisesByConceptId.get(ex.concept_id) ?? 0) + 1)
  }

  // attempts + score sum per concept
  const attemptsByConceptId = new Map<string, { count: number; scoreSum: number; scoredCount: number }>()
  for (const a of attempts) {
    if (!a.exercise_id) continue
    const conceptId = conceptByExercise.get(a.exercise_id)
    if (!conceptId) continue
    const cur = attemptsByConceptId.get(conceptId) ?? { count: 0, scoreSum: 0, scoredCount: 0 }
    cur.count++
    if (a.ai_score !== null) { cur.scoreSum += a.ai_score; cur.scoredCount++ }
    attemptsByConceptId.set(conceptId, cur)
  }

  // mastered users per concept (distinct user_id via Set)
  const masteredByConceptId = new Map<string, number>()
  for (const p of progress) {
    masteredByConceptId.set(p.concept_id, (masteredByConceptId.get(p.concept_id) ?? 0) + 1)
  }

  const statsMap = new Map<string, ConceptStats>()
  for (const conceptId of conceptIds) {
    const atData = attemptsByConceptId.get(conceptId)
    statsMap.set(conceptId, {
      exerciseCount: exercisesByConceptId.get(conceptId) ?? 0,
      attemptCount: atData?.count ?? 0,
      avgScore: atData && atData.scoredCount > 0 ? atData.scoreSum / atData.scoredCount : null,
      masteredUsers: masteredByConceptId.get(conceptId) ?? 0,
    })
  }

  return (
    <section className="mt-8 space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Per-concept stats
      </h2>
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Concept</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Exercises</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Attempts</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Avg score</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Mastered</th>
            </tr>
          </thead>
          <tbody>
            {conceptIds.map((id, i) => {
              const s = statsMap.get(id)!
              return (
                <tr key={id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground truncate max-w-[200px]">{id}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.exerciseCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.attemptCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {s.avgScore !== null ? s.avgScore.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.masteredUsers}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function AdminCurriculumDeferredSkeleton() {
  return (
    <div className="mt-8 space-y-2">
      <div className="animate-pulse h-4 w-32 rounded bg-muted" />
      <div className="animate-pulse rounded-xl bg-muted h-48" />
    </div>
  )
}
