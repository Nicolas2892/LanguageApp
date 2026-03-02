import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { WriteSession } from './WriteSession'
import { ConceptPicker } from './ConceptPicker'
import type { Concept, Module, Unit } from '@/lib/supabase/types'

interface Props {
  searchParams: Promise<{ concepts?: string; suggested?: string; concept?: string }>
}

export default async function WritePage({ searchParams }: Props) {
  const { concepts: conceptsParam, suggested: suggestedParam, concept: legacyConceptParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Resolve conceptIds: ?concepts=id1,id2 or legacy ?concept=id
  const rawIds = conceptsParam ?? (legacyConceptParam ? legacyConceptParam : null)
  const conceptIds = rawIds
    ? rawIds.split(',').map((s) => s.trim()).filter(Boolean)
    : null

  if (conceptIds && conceptIds.length > 0) {
    // WriteSession mode — fetch concept titles for display
    const { data: conceptRows } = await supabase
      .from('concepts')
      .select('id, title')
      .in('id', conceptIds)

    if (!conceptRows || conceptRows.length === 0) redirect('/write')

    const typedConcepts = conceptRows as Pick<Concept, 'id' | 'title'>[]
    const conceptInfos = conceptIds
      .map((id) => typedConcepts.find((c) => c.id === id))
      .filter((c): c is Pick<Concept, 'id' | 'title'> => c !== undefined)

    const pageTitle = conceptInfos.map((c) => c.title).join(' + ')

    return (
      <main className="max-w-xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/write"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
        <div>
          <h1 className="text-xl font-bold">Free write</h1>
          <p className="text-sm text-muted-foreground mt-1">{pageTitle}</p>
        </div>
        <ErrorBoundary>
          <WriteSession conceptIds={conceptIds} conceptInfos={conceptInfos} />
        </ErrorBoundary>
      </main>
    )
  }

  // ConceptPicker mode — fetch full curriculum + user progress
  const [modulesRes, unitsRes, conceptsRes, progressRes] = await Promise.all([
    supabase.from('modules').select('id, title').order('order_index'),
    supabase.from('units').select('id, module_id, title').order('order_index'),
    supabase.from('concepts').select('id, unit_id, title, difficulty').order('difficulty'),
    supabase.from('user_progress').select('concept_id, interval_days').eq('user_id', user.id),
  ])

  type ModuleRow = Pick<Module, 'id' | 'title'>
  type UnitRow = Pick<Unit, 'id' | 'module_id' | 'title'>
  type ConceptRow = Pick<Concept, 'id' | 'unit_id' | 'title' | 'difficulty'>
  type ProgressRow = { concept_id: string; interval_days: number }

  const modules = (modulesRes.data ?? []) as ModuleRow[]
  const units = (unitsRes.data ?? []) as UnitRow[]
  const rawConcepts = (conceptsRes.data ?? []) as ConceptRow[]
  const progressMap = new Map(
    ((progressRes.data ?? []) as ProgressRow[]).map((p) => [p.concept_id, p.interval_days])
  )

  const concepts = rawConcepts.map((c) => ({
    ...c,
    interval_days: progressMap.get(c.id),
  }))

  // Validate suggestedId is a real concept
  const suggestedId = suggestedParam && concepts.some((c) => c.id === suggestedParam)
    ? suggestedParam
    : null

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Dashboard
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-bold">Free write</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose one or more concepts to write about.
        </p>
      </div>
      <ConceptPicker
        modules={modules}
        units={units}
        concepts={concepts}
        suggestedId={suggestedId}
      />
    </main>
  )
}
