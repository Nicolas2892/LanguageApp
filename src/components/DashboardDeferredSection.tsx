import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { WeeklySnapshot } from '@/components/WeeklySnapshot'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { PenLine, RotateCcw } from 'lucide-react'
import type { Concept } from '@/lib/supabase/types'

interface Props {
  userId: string
  isNewUser: boolean
  thisWeekStart: string // ISO string
  lastWeekStart: string // ISO string
}

export async function DashboardDeferredSection({
  userId,
  isNewUser,
  thisWeekStart,
  lastWeekStart,
}: Props) {
  const supabase = await createClient()

  // Batch 1 — all parallelized
  const [
    weakestProgressRes,
    mistakeAttemptsRes,
    thisWeekAttemptsRes,
    lastWeekAttemptsRes,
    thisWeekSessionsRes,
    lastWeekSessionsRes,
  ] = await Promise.all([
    supabase
      .from('user_progress')
      .select('concept_id, interval_days')
      .eq('user_id', userId)
      .lt('interval_days', MASTERY_THRESHOLD)
      .order('interval_days', { ascending: true })
      .limit(1),
    supabase
      .from('exercise_attempts')
      .select('exercise_id')
      .eq('user_id', userId)
      .lte('ai_score', 1)
      .not('exercise_id', 'is', null)
      .limit(100),
    supabase
      .from('exercise_attempts')
      .select('ai_score')
      .eq('user_id', userId)
      .gte('created_at', thisWeekStart),
    supabase
      .from('exercise_attempts')
      .select('ai_score')
      .eq('user_id', userId)
      .gte('created_at', lastWeekStart)
      .lt('created_at', thisWeekStart),
    supabase
      .from('study_sessions')
      .select('started_at, ended_at')
      .eq('user_id', userId)
      .gte('started_at', thisWeekStart),
    supabase
      .from('study_sessions')
      .select('started_at, ended_at')
      .eq('user_id', userId)
      .gte('started_at', lastWeekStart)
      .lt('started_at', thisWeekStart),
  ])

  const weakestConceptId =
    (weakestProgressRes.data?.[0] as { concept_id: string } | undefined)?.concept_id ?? null

  const mistakeExerciseIds = [
    ...new Set(
      (mistakeAttemptsRes.data ?? [])
        .map((a) => (a as { exercise_id: string | null }).exercise_id)
        .filter((id): id is string => id !== null)
    ),
  ]

  // Batch 2 — independent follow-ups gated on batch 1 results
  const [writeConceptRes, mistakeExercisesRes] = await Promise.all([
    !isNewUser && weakestConceptId
      ? supabase.from('concepts').select('id, title').eq('id', weakestConceptId).single()
      : Promise.resolve({ data: null, error: null }),
    !isNewUser && mistakeExerciseIds.length > 0
      ? supabase.from('exercises').select('concept_id').in('id', mistakeExerciseIds)
      : Promise.resolve({ data: null, error: null }),
  ])

  const writeConcept = writeConceptRes.data as Pick<Concept, 'id' | 'title'> | null
  const mistakeConceptCount = mistakeExercisesRes.data
    ? new Set(
        (mistakeExercisesRes.data as { concept_id: string }[]).map((e) => e.concept_id)
      ).size
    : 0

  // Weekly snapshot stats
  type AttemptRow = { ai_score: number | null }
  type SessionRow = { started_at: string; ended_at: string | null }

  const thisWeekAttempts = (thisWeekAttemptsRes.data ?? []) as AttemptRow[]
  const lastWeekAttempts = (lastWeekAttemptsRes.data ?? []) as AttemptRow[]
  const thisWeekExercises = thisWeekAttempts.length
  const lastWeekExercises = lastWeekAttempts.length
  const thisWeekAccuracy =
    thisWeekExercises > 0
      ? Math.round(
          (thisWeekAttempts.filter((a) => (a.ai_score ?? 0) >= 2).length / thisWeekExercises) * 100
        )
      : null
  const lastWeekAccuracy =
    lastWeekExercises > 0
      ? Math.round(
          (lastWeekAttempts.filter((a) => (a.ai_score ?? 0) >= 2).length / lastWeekExercises) * 100
        )
      : null
  const calcMinutes = (sessions: SessionRow[]) =>
    sessions.reduce((sum, s) => {
      if (!s.ended_at) return sum
      return sum + Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
    }, 0)
  const thisWeekMinutes = calcMinutes((thisWeekSessionsRes.data ?? []) as SessionRow[])
  const lastWeekMinutes = calcMinutes((lastWeekSessionsRes.data ?? []) as SessionRow[])
  const exerciseDelta = lastWeekExercises > 0 ? thisWeekExercises - lastWeekExercises : null
  const accuracyDelta =
    thisWeekAccuracy !== null && lastWeekAccuracy !== null
      ? thisWeekAccuracy - lastWeekAccuracy
      : null
  const minutesDelta = lastWeekMinutes > 0 ? thisWeekMinutes - lastWeekMinutes : null

  return (
    <>
      {/* Weekly snapshot — only shown after user has studied this week */}
      {thisWeekExercises > 0 && (
        <WeeklySnapshot
          exercises={thisWeekExercises}
          accuracy={thisWeekAccuracy}
          minutes={thisWeekMinutes}
          exerciseDelta={exerciseDelta}
          accuracyDelta={accuracyDelta}
          minutesDelta={minutesDelta}
        />
      )}

      {/* Escritura Libre card */}
      {!isNewUser && writeConcept && (
        <div className="border border-l-4 border-l-primary rounded-xl p-6 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Escritura Libre
            </p>
            <PenLine className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-bold">{writeConcept.title}</p>
          <p className="text-xs text-muted-foreground -mt-1">Vale La Pena Tomarse Un Momento</p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/write?suggested=${writeConcept.id}`}>Escribir Ahora →</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground h-8">
            <Link href="/write">Cambiar Concepto →</Link>
          </Button>
        </div>
      )}
      {!isNewUser && !writeConcept && (
        <div className="border border-l-4 border-l-primary rounded-xl p-6 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Escritura Libre
            </p>
            <PenLine className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-bold">Practica Tu Escritura</p>
          <p className="text-muted-foreground text-sm">Elige Un Concepto Y Escribe Libremente.</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/write">Explorar Conceptos →</Link>
          </Button>
        </div>
      )}

      {/* Revisar Errores card — shown when user has failed attempts */}
      {!isNewUser && mistakeConceptCount > 0 && (
        <div className="border border-l-4 border-l-amber-500 rounded-xl p-6 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Revisar Errores
            </p>
            <RotateCcw className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-bold">
            {mistakeConceptCount} Concepto{mistakeConceptCount !== 1 ? 's' : ''} Para Revisar
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/study?mode=review">Repasar Ahora →</Link>
          </Button>
        </div>
      )}
    </>
  )
}

export function DashboardDeferredSkeleton() {
  return (
    <>
      <div className="animate-senda-pulse senda-skeleton-fill rounded-xl h-24" />
      <div className="animate-senda-pulse senda-skeleton-fill rounded-xl h-36" />
      <div className="animate-senda-pulse senda-skeleton-fill rounded-xl h-36" />
    </>
  )
}
