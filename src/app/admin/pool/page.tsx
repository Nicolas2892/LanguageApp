import { createClient } from '@/lib/supabase/server'
import { EXERCISE_CAP_PER_TYPE } from '@/lib/constants'
import { PoolGrid } from './PoolGrid'

const GENERATABLE_TYPES = ['gap_fill', 'translation', 'transformation', 'error_correction'] as const
const ALL_TYPES = [...GENERATABLE_TYPES, 'sentence_builder', 'free_write'] as const

type ModuleRow = { id: string; title: string; order_index: number }
type UnitRow = { id: string; module_id: string; title: string; order_index: number }
type ConceptRow = { id: string; unit_id: string; title: string }
type CountRow = { concept_id: string; type: string; count: number }

export default async function AdminPoolPage() {
  const supabase = await createClient()

  const [modulesRes, unitsRes, conceptsRes, countsRes] = await Promise.all([
    supabase.from('modules').select('id, title, order_index').order('order_index'),
    supabase.from('units').select('id, module_id, title, order_index').order('order_index'),
    supabase.from('concepts').select('id, unit_id, title'),
    supabase.rpc('get_exercise_counts_by_concept_type' as never) as unknown as { data: CountRow[] | null },
  ])

  const modules = (modulesRes.data ?? []) as ModuleRow[]
  const units = (unitsRes.data ?? []) as UnitRow[]
  const concepts = (conceptsRes.data ?? []) as ConceptRow[]

  // If RPC doesn't exist yet, fall back to a manual count query
  let countMap: Map<string, number>
  if (countsRes.data && Array.isArray(countsRes.data)) {
    countMap = new Map(countsRes.data.map((r) => [`${r.concept_id}:${r.type}`, r.count]))
  } else {
    // Fallback: fetch all exercises and count client-side
    const { data: allExercises } = await supabase
      .from('exercises')
      .select('concept_id, type')
    const exercises = (allExercises ?? []) as Array<{ concept_id: string; type: string }>
    countMap = new Map<string, number>()
    for (const ex of exercises) {
      const key = `${ex.concept_id}:${ex.type}`
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }
  }

  // Build hierarchical structure for the grid
  const unitsByModule = new Map<string, typeof units>()
  for (const u of units) {
    const arr = unitsByModule.get(u.module_id) ?? []
    arr.push(u)
    unitsByModule.set(u.module_id, arr)
  }

  const conceptsByUnit = new Map<string, typeof concepts>()
  for (const c of concepts) {
    const arr = conceptsByUnit.get(c.unit_id) ?? []
    arr.push(c)
    conceptsByUnit.set(c.unit_id, arr)
  }

  // Serialize count map for client component
  const counts: Record<string, number> = {}
  for (const [key, value] of countMap) {
    counts[key] = value
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercise Pool</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exercise counts per concept × type. Cap: {EXERCISE_CAP_PER_TYPE} per type.
        </p>
      </div>

      <PoolGrid
        modules={modules}
        unitsByModule={Object.fromEntries(unitsByModule)}
        conceptsByUnit={Object.fromEntries(conceptsByUnit)}
        counts={counts}
        cap={EXERCISE_CAP_PER_TYPE}
        allTypes={ALL_TYPES as unknown as string[]}
        generatableTypes={GENERATABLE_TYPES as unknown as string[]}
      />
    </div>
  )
}
