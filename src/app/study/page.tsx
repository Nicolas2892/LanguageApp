import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StudySession } from './StudySession'
import type { StudyItem } from './StudySession'
import type { Concept, Exercise } from '@/lib/supabase/types'

const SESSION_SIZE = 10
const BOOTSTRAP_SIZE = 5

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{
    concept?: string
    unit?: string
    module?: string
    types?: string        // comma-separated exercise types
    mode?: string         // 'due' (default) | 'all'
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const filterTypes = params.types ? params.types.split(',').filter(Boolean) : []
  const isFiltered = !!(params.concept || params.unit || params.module || filterTypes.length)
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
  } else {
    // Default: SRS due queue
    const { data: dueProgress } = await supabase
      .from('user_progress')
      .select('concept_id')
      .eq('user_id', user.id)
      .lte('due_date', today)
      .limit(SESSION_SIZE)

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
          .order('difficulty', { ascending: true })
          .limit(BOOTSTRAP_SIZE)
        conceptIds = (bootstrapConcepts ?? []).map((c) => (c as { id: string }).id)
      }
    }
  }

  if (conceptIds.length === 0) {
    return (
      <main className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">All caught up!</h1>
        <p className="text-muted-foreground">No concepts are due for review today.</p>
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/study/configure" className="underline">Practice anyway →</Link>
          <Link href="/dashboard" className="underline">Dashboard</Link>
        </div>
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
      <main className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">No exercises found</h1>
        <p className="text-muted-foreground">
          No {filterTypes.length > 0 ? filterTypes.join(', ').replace(/_/g, ' ') : ''} exercises exist for this selection.
        </p>
        <Link href="/study/configure" className="underline text-sm">Change filters →</Link>
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
    const exercise = exArr[Math.floor(Math.random() * exArr.length)]
    items.push({ concept, exercise })
  }

  if (items.length === 0) redirect('/dashboard')

  // Build a back-link label
  const backHref = isFiltered ? '/curriculum' : '/dashboard'
  const backLabel = isFiltered ? '← Curriculum' : '← Dashboard'

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Study session</h1>
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
          {backLabel}
        </Link>
      </div>
      <StudySession items={items} />
    </main>
  )
}
