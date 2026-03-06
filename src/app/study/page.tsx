import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StudySession } from './StudySession'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SESSION_SIZE, BOOTSTRAP_SIZE } from '@/lib/constants'
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
    practice?: string     // 'true' = drill mode (all exercises, skip SRS)
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
  const isPracticeMode = params.practice === 'true' && !!params.concept && filterTypes.length > 0
  const isSprint = params.mode === 'sprint'
  const sprintLimitType = params.limitType === 'count' ? 'count' : 'time'
  const sprintLimit = Math.min(Math.max(parseInt(params.limit ?? '10', 10) || 10, 1), 60)
  const today = new Date().toISOString().split('T')[0]

  let conceptIds: string[] = []

  if (params.concept) {
    // Single concept — always practice regardless of due date
    conceptIds = [params.concept]
  } else if (params.unit) {
    // All concepts in a unit
    const { data } = await supabase
      .from('concepts').select('id').eq('unit_id', params.unit)
    conceptIds = (data ?? []).map((c) => (c as { id: string }).id)
  } else if (params.module) {
    // All concepts in a module (via units)
    const { data: units } = await supabase
      .from('units').select('id').eq('module_id', params.module)
    const unitIds = (units ?? []).map((u) => (u as { id: string }).id)
    if (unitIds.length > 0) {
      const { data } = await supabase
        .from('concepts').select('id').in('unit_id', unitIds)
      conceptIds = (data ?? []).map((c) => (c as { id: string }).id)
    }
  } else if (isSprint) {
    // Sprint: SRS due queue, optionally filtered by module
    if (params.module) {
      const { data: units } = await supabase
        .from('units').select('id').eq('module_id', params.module)
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
      <main className="max-w-xl mx-auto p-8 text-center space-y-5">
        <svg className="mx-auto h-14 w-14 text-muted-foreground/40" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h30M9 18h30M9 24h18m9 0l4.5 4.5m0 0L36 24m4.5 4.5L36 33m4.5-4.5H30" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a2 2 0 012-2h32a2 2 0 012 2v32a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
        </svg>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All caught up!</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">No concepts are due for review today. Great work!</p>
        </div>
        <Link
          href="/study/configure"
          className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-transform"
        >
          Practice anyway →
        </Link>
      </main>
    )
  }

  // Fetch concepts
  const { data: concepts } = await supabase
    .from('concepts').select('*').in('id', conceptIds)
  if (!concepts || concepts.length === 0) redirect('/dashboard')
  const typedConcepts = concepts as Concept[]
  const conceptMap = new Map(typedConcepts.map((c) => [c.id, c]))

  // Fetch exercises — filter by type if specified
  let exerciseQuery = supabase.from('exercises').select('*').in('concept_id', conceptIds)
  if (filterTypes.length > 0) {
    exerciseQuery = exerciseQuery.in('type', filterTypes)
  }
  const { data: exercises } = await exerciseQuery
  if (!exercises || exercises.length === 0) {
    return (
      <main className="max-w-xl mx-auto p-8 text-center space-y-5">
        <svg className="mx-auto h-14 w-14 text-muted-foreground/40" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1.5">
          <circle cx="24" cy="24" r="18" />
          <path strokeLinecap="round" d="M24 16v8m0 8h.01" />
        </svg>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">No exercises found</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            No {filterTypes.length > 0 ? filterTypes.join(', ').replace(/_/g, ' ') : ''} exercises exist for this selection.
          </p>
        </div>
        <Link
          href="/study/configure"
          className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-transform"
        >
          Change filters →
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
    if (isPracticeMode) {
      // Drill mode: include all exercises of the requested type
      for (const ex of exArr) {
        items.push({ concept, exercise: ex })
      }
    } else {
      // SRS mode: one random exercise per concept
      const exercise = exArr[Math.floor(Math.random() * exArr.length)]
      items.push({ concept, exercise })
    }
  }

  // Interleave by unit in SRS/sprint modes so each session mixes grammar areas (Ped-H)
  const shouldInterleave = !params.concept && !params.unit && !params.module && !isPracticeMode
  const orderedItems = shouldInterleave ? interleaveByUnit(items) : items

  // Cap items to sessionSize (only in non-sprint, non-drill modes)
  const cappedItems = (!isSprint && !isPracticeMode) ? orderedItems.slice(0, sessionSize) : orderedItems

  if (cappedItems.length === 0) redirect('/dashboard')

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 pb-24 lg:pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Study session</h1>
      </div>
      <ErrorBoundary>
        <StudySession
          items={cappedItems}
          practiceMode={isPracticeMode}
          generateConfig={
            isPracticeMode && params.concept && filterTypes[0] && GENERATABLE_TYPES.has(filterTypes[0])
              ? {
                  conceptId: params.concept,
                  concept: conceptMap.get(params.concept)!,
                  exerciseType: filterTypes[0],
                }
              : undefined
          }
          returnHref={isPracticeMode && params.concept ? `/curriculum/${params.concept}` : undefined}
          sprintConfig={isSprint ? { limitType: sprintLimitType, limit: sprintLimit } : undefined}
          freeWriteConceptId={params.concept && !isSprint ? params.concept : undefined}
        />
      </ErrorBoundary>
    </main>
  )
}
