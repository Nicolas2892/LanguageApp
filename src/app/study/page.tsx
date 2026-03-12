import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StudySession } from './StudySession'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SESSION_SIZE, BOOTSTRAP_SIZE, MIN_PRACTICE_SIZE } from '@/lib/constants'
import { cycleToMinimum } from '@/lib/practiceUtils'
import { computeUnlockedLevels } from '@/lib/curriculum/prerequisites'
import type { CefrLevel } from '@/lib/curriculum/prerequisites'
import type { StudyItem } from './StudySession'
import type { Concept, Exercise } from '@/lib/supabase/types'

function interleaveByUnit(items: StudyItem[]): StudyItem[] {
  const groups = new Map<string, StudyItem[]>()
  for (const item of items) {
    const uid = item.concept.unit_id
    const arr = groups.get(uid) ?? []
    arr.push(item)
    groups.set(uid, arr)
  }
  const queues = Array.from(groups.values())
  const result: StudyItem[] = []
  const maxLen = Math.max(...queues.map((q) => q.length), 0)
  for (let i = 0; i < maxLen; i++) {
    for (const queue of queues) {
      if (i < queue.length) result.push(queue[i])
    }
  }
  return result
}

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    concept?: string
    unit?: string
    module?: string
    types?: string        // comma-separated exercise types
    mode?: string         // 'new' = unlearned concepts queue | 'sprint' = time/count-capped SRS
    practice?: string     // 'true' = open practice mode (no SRS gate)
    limitType?: string    // 'time' | 'count' (sprint mode)
    limit?: string        // minutes or exercise count (sprint mode)
    size?: string         // session size override (default: SESSION_SIZE)
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const sessionSize = params.size ? Math.min(Math.max(parseInt(params.size, 10) || SESSION_SIZE, 1), 50) : SESSION_SIZE
  const filterTypes = params.types ? params.types.split(',').filter(Boolean) : []
  const GENERATABLE_TYPES = new Set(['gap_fill', 'translation', 'transformation', 'error_correction'])

  // isOpenPractice: any session with practice=true (no SRS gate)
  const isOpenPractice = params.practice === 'true'
  // isDrillMode: narrow drill — practice=true with a specific concept + type filter (enables AI generation)
  const isDrillMode = isOpenPractice && !!params.concept && filterTypes.length > 0

  const isSprint = params.mode === 'sprint'
  const sprintLimitType = params.limitType === 'count' ? 'count' : 'time'
  const sprintLimit = Math.min(Math.max(parseInt(params.limit ?? '10', 10) || 10, 1), 60)
  const today = new Date().toISOString().split('T')[0]

  let conceptIds: string[] = []
  // Review mode: maps conceptId → specific exerciseId to replay
  const reviewExerciseByConceptId = new Map<string, string>()

  if (isOpenPractice && params.concept) {
    // Open Practice — single concept
    conceptIds = [params.concept]
  } else if (isOpenPractice && params.unit) {
    // Open Practice — all concepts in a unit
    const { data } = await supabase
      .from('concepts').select('id').eq('unit_id', params.unit)
    conceptIds = (data ?? []).map((c) => (c as { id: string }).id)
  } else if (isOpenPractice && params.module) {
    // Open Practice — one or more modules (comma-separated)
    const moduleIds = params.module.split(',').filter(Boolean)
    const { data: units } = await supabase
      .from('units').select('id').in('module_id', moduleIds)
    const unitIds = (units ?? []).map((u) => (u as { id: string }).id)
    if (unitIds.length > 0) {
      const { data } = await supabase
        .from('concepts').select('id').in('unit_id', unitIds)
      conceptIds = (data ?? []).map((c) => (c as { id: string }).id)
    }
  } else if (isOpenPractice) {
    // Open Practice — whole catalog, no SRS gate
    const { data } = await supabase
      .from('concepts').select('id').limit(sessionSize)
    conceptIds = (data ?? []).map((c) => (c as { id: string }).id)
  } else if (isSprint) {
    // Sprint: SRS due queue, optionally filtered by one or more modules (comma-separated)
    if (params.module) {
      const moduleIds = params.module.split(',').filter(Boolean)
      const { data: units } = await supabase
        .from('units').select('id').in('module_id', moduleIds)
      const unitIds = (units ?? []).map((u) => (u as { id: string }).id)
      if (unitIds.length > 0) {
        const { data: moduleConceptsData } = await supabase
          .from('concepts').select('id').in('unit_id', unitIds)
        const moduleConceptIds = (moduleConceptsData ?? []).map((c) => (c as { id: string }).id)
        if (moduleConceptIds.length > 0) {
          const { data: dueProgress } = await supabase
            .from('user_progress')
            .select('concept_id')
            .eq('user_id', user.id)
            .lte('due_date', today)
            .in('concept_id', moduleConceptIds)
          conceptIds = (dueProgress ?? []).map((p) => (p as { concept_id: string }).concept_id)
        }
      }
    } else {
      // All due SRS concepts — no SESSION_SIZE cap; StudySession enforces the limit
      const { data: dueProgress } = await supabase
        .from('user_progress')
        .select('concept_id')
        .eq('user_id', user.id)
        .lte('due_date', today)
      conceptIds = (dueProgress ?? []).map((p) => (p as { concept_id: string }).concept_id)
    }
    // Bootstrap new users (same as default SRS path)
    if (conceptIds.length === 0) {
      const { count } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((count ?? 0) === 0) {
        const { data: bootstrapConcepts } = await supabase
          .from('concepts')
          .select('id')
          .eq('level', 'B1')
          .order('difficulty', { ascending: true })
          .limit(BOOTSTRAP_SIZE)
        conceptIds = (bootstrapConcepts ?? []).map((c) => (c as { id: string }).id)
      }
    }
  } else if (params.mode === 'new') {
    // Learn new: concepts not yet studied (not in user_progress), filtered to unlocked CEFR levels
    const [studiedProgress, unlockedLevels] = await Promise.all([
      supabase.from('user_progress').select('concept_id').eq('user_id', user.id),
      computeUnlockedLevels(supabase, user.id),
    ])
    const studiedIds = new Set(
      ((studiedProgress.data ?? []) as { concept_id: string }[]).map((p) => p.concept_id)
    )
    const { data: allConcepts } = await supabase
      .from('concepts')
      .select('id, level')
      .order('difficulty', { ascending: true })
    const unlearnedIds = (allConcepts ?? [])
      .filter((c) => {
        const concept = c as { id: string; level: string | null }
        return !studiedIds.has(concept.id) && unlockedLevels.has((concept.level ?? 'B1') as CefrLevel)
      })
      .map((c) => (c as { id: string }).id)
      .slice(0, SESSION_SIZE)
    if (unlearnedIds.length === 0) redirect('/dashboard')
    conceptIds = unlearnedIds
  } else if (params.mode === 'review') {
    // Mistake review: most-recent failed attempt per concept
    const { data: failedAttempts } = await supabase
      .from('exercise_attempts')
      .select('exercise_id')
      .eq('user_id', user.id)
      .lte('ai_score', 1)
      .not('exercise_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    const failedExerciseIds = (failedAttempts ?? [])
      .map((a) => (a as { exercise_id: string | null }).exercise_id)
      .filter((id): id is string => id !== null)

    if (failedExerciseIds.length === 0) redirect('/dashboard')

    // Fetch exercises to map exerciseId → conceptId
    const { data: failedExercisesData } = await supabase
      .from('exercises')
      .select('id, concept_id')
      .in('id', failedExerciseIds)

    const exerciseToConceptMap = new Map(
      (failedExercisesData ?? []).map((e) => {
        const ex = e as { id: string; concept_id: string }
        return [ex.id, ex.concept_id] as [string, string]
      })
    )

    // Walk in most-recent-first order, deduplicate by concept
    const seenConceptIds = new Set<string>()
    for (const exId of failedExerciseIds) {
      const conceptId = exerciseToConceptMap.get(exId)
      if (!conceptId || seenConceptIds.has(conceptId)) continue
      seenConceptIds.add(conceptId)
      reviewExerciseByConceptId.set(conceptId, exId)
      if (reviewExerciseByConceptId.size >= sessionSize) break
    }

    if (reviewExerciseByConceptId.size === 0) redirect('/dashboard')
    conceptIds = [...seenConceptIds]
  } else {
    // Default: SRS due queue
    const { data: dueProgress } = await supabase
      .from('user_progress')
      .select('concept_id')
      .eq('user_id', user.id)
      .lte('due_date', today)
      .limit(sessionSize)

    conceptIds = (dueProgress ?? []).map((p) => (p as { concept_id: string }).concept_id)

    // Bootstrap new users
    if (conceptIds.length === 0) {
      const { count } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((count ?? 0) === 0) {
        const { data: bootstrapConcepts } = await supabase
          .from('concepts')
          .select('id')
          .eq('level', 'B1')
          .order('difficulty', { ascending: true })
          .limit(BOOTSTRAP_SIZE)
        conceptIds = (bootstrapConcepts ?? []).map((c) => (c as { id: string }).id)
      }
    }
  }

  if (conceptIds.length === 0) {
    return (
      <main className="max-w-2xl mx-auto p-8 text-center space-y-5">
        <svg className="mx-auto h-14 w-14 text-muted-foreground/40" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h30M9 18h30M9 24h18m9 0l4.5 4.5m0 0L36 24m4.5 4.5L36 33m4.5-4.5H30" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a2 2 0 012-2h32a2 2 0 012 2v32a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
        </svg>
        <div>
          <h1 className="senda-heading text-2xl">¡Todo al día!</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">No hay conceptos pendientes hoy. ¡Buen trabajo!</p>
        </div>
        <Link href="/study/configure?mode=practice" className="senda-cta">
          Practicar de Todos Modos →
        </Link>
      </main>
    )
  }

  // Build exercise query (not yet awaited)
  let exerciseQuery = supabase.from('exercises').select('*').in('concept_id', conceptIds)
  if (filterTypes.length > 0) {
    exerciseQuery = exerciseQuery.in('type', filterTypes)
  }

  // Fetch concepts + exercises in parallel
  const [{ data: concepts }, { data: exercises }] = await Promise.all([
    supabase.from('concepts').select('*').in('id', conceptIds),
    exerciseQuery,
  ])
  if (!concepts || concepts.length === 0) redirect('/dashboard')
  const typedConcepts = concepts as Concept[]
  const conceptMap = new Map(typedConcepts.map((c) => [c.id, c]))

  if (!exercises || exercises.length === 0) {
    return (
      <main className="max-w-2xl mx-auto p-8 text-center space-y-5">
        <svg className="mx-auto h-14 w-14 text-muted-foreground/40" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1.5">
          <circle cx="24" cy="24" r="18" />
          <path strokeLinecap="round" d="M24 16v8m0 8h.01" />
        </svg>
        <div>
          <h1 className="senda-heading text-2xl">Sin ejercicios</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            No hay ejercicios {filterTypes.length > 0 ? `de tipo ${filterTypes.join(', ').replace(/_/g, ' ')}` : ''} para esta selección.
          </p>
        </div>
        <Link href="/study/configure" className="senda-cta">
          Cambiar Filtros →
        </Link>
      </main>
    )
  }

  const typedExercises = exercises as Exercise[]
  const exercisesByConceptId = new Map<string, Exercise[]>()
  for (const ex of typedExercises) {
    const arr = exercisesByConceptId.get(ex.concept_id) ?? []
    arr.push(ex)
    exercisesByConceptId.set(ex.concept_id, arr)
  }

  const items: StudyItem[] = []
  for (const conceptId of conceptIds) {
    const concept = conceptMap.get(conceptId)
    const exArr = exercisesByConceptId.get(conceptId)
    if (!concept || !exArr || exArr.length === 0) continue
    if (isDrillMode) {
      // Narrow drill: all exercises of the requested type (enables AI generation)
      for (const ex of exArr) {
        items.push({ concept, exercise: ex })
      }
    } else if (isOpenPractice) {
      // Open Practice: all exercises for the concept (no type filter at assembly level)
      for (const ex of exArr) {
        items.push({ concept, exercise: ex })
      }
    } else if (reviewExerciseByConceptId.size > 0) {
      // Review mode: use the specific failed exercise for this concept
      // eslint-disable-next-line react-hooks/purity
      const randomExercise = exArr[Math.floor(Math.random() * exArr.length)]
      const targetExId = reviewExerciseByConceptId.get(conceptId)
      const exercise = (targetExId ? exArr.find((e) => e.id === targetExId) : undefined) ?? randomExercise
      items.push({ concept, exercise })
    } else {
      // SRS mode: one random exercise per concept
      // eslint-disable-next-line react-hooks/purity
      const exercise = exArr[Math.floor(Math.random() * exArr.length)]
      items.push({ concept, exercise })
    }
  }

  // Apply minimum cycling for Open Practice sessions (Fix-H)
  const paddedItems = isOpenPractice ? cycleToMinimum(items, MIN_PRACTICE_SIZE) : items

  // Interleave by unit in SRS/sprint modes so each session mixes grammar areas (Ped-H)
  const shouldInterleave = !isOpenPractice && !isSprint && !params.concept && !params.unit && !params.module && params.mode !== 'review'
  const orderedItems = shouldInterleave ? interleaveByUnit(paddedItems) : paddedItems

  // Cap items to sessionSize (only in non-sprint, non-drill modes)
  const cappedItems = (!isSprint && !isDrillMode) ? orderedItems.slice(0, sessionSize) : orderedItems

  if (cappedItems.length === 0) redirect('/dashboard')

  // Build a human-readable session label for the session header badge
  const sessionLabel = isOpenPractice
    ? (params.concept
        ? `Practice: ${conceptMap.get(params.concept)?.title ?? 'Concept'}`
        : params.module
        ? 'Module practice'
        : params.unit
        ? 'Unit practice'
        : 'Open Practice')
    : isSprint
    ? 'SRS Sprint'
    : params.mode === 'new'
    ? 'New concepts'
    : params.mode === 'review'
    ? 'Mistake review'
    : 'Review session'

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <div className="mb-8">
        <h1 className="senda-heading text-2xl">Sesión de Estudio</h1>
      </div>
      <ErrorBoundary>
        <StudySession
          items={cappedItems}
          practiceMode={isDrillMode}
          generateConfig={
            isDrillMode && params.concept && filterTypes[0] && GENERATABLE_TYPES.has(filterTypes[0])
              ? {
                  conceptId: params.concept,
                  concept: conceptMap.get(params.concept)!,
                  exerciseType: filterTypes[0],
                }
              : undefined
          }
          returnHref={isDrillMode && params.concept ? `/curriculum/${params.concept}` : undefined}
          sprintConfig={isSprint ? { limitType: sprintLimitType, limit: sprintLimit } : undefined}
          freeWriteConceptId={params.concept && !isSprint ? params.concept : undefined}
          sessionLabel={sessionLabel}
        />
      </ErrorBoundary>
    </main>
  )
}
