import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LevelChip } from '@/components/LevelChip'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { ChevronRight } from 'lucide-react'
import { AdminCurriculumDeferred, AdminCurriculumDeferredSkeleton } from './AdminCurriculumDeferred'

export default async function AdminCurriculumPage() {
  const supabase = await createClient()

  const [modulesRes, unitsRes, conceptsRes] = await Promise.all([
    supabase.from('modules').select('id, title, order_index').order('order_index'),
    supabase.from('units').select('id, module_id, title, order_index').order('order_index'),
    supabase.from('concepts').select('id, unit_id, title, level, grammar_focus, difficulty').order('difficulty'),
  ])

  type ModuleRow  = { id: string; title: string; order_index: number }
  type UnitRow    = { id: string; module_id: string; title: string; order_index: number }
  type ConceptRow = { id: string; unit_id: string; title: string; level: string | null; grammar_focus: string | null; difficulty: number }

  const modules  = (modulesRes.data  ?? []) as ModuleRow[]
  const units    = (unitsRes.data    ?? []) as UnitRow[]
  const concepts = (conceptsRes.data ?? []) as ConceptRow[]

  const unitsByModule  = new Map<string, UnitRow[]>()
  const conceptsByUnit = new Map<string, ConceptRow[]>()
  for (const u of units)    { const a = unitsByModule.get(u.module_id)  ?? []; a.push(u); unitsByModule.set(u.module_id, a) }
  for (const c of concepts) { const a = conceptsByUnit.get(c.unit_id)   ?? []; a.push(c); conceptsByUnit.set(c.unit_id, a) }

  const allConceptIds = concepts.map((c) => c.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Curriculum</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {modules.length} modules · {units.length} units · {concepts.length} concepts
        </p>
      </div>

      <div className="space-y-3">
        {modules.map((mod) => {
          const modUnits    = unitsByModule.get(mod.id) ?? []
          const modConcepts = modUnits.flatMap((u) => conceptsByUnit.get(u.id) ?? [])

          return (
            <details key={mod.id} open className="group border rounded-xl bg-card shadow-sm overflow-hidden">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-4 py-3">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90 text-muted-foreground" strokeWidth={1.5} />
                  <h2 className="font-bold text-sm">{mod.title}</h2>
                  <span className="text-xs text-muted-foreground">({modConcepts.length} concepts)</span>
                </div>
              </summary>

              <div className="border-t px-4 pb-3 pt-2 space-y-4">
                {modUnits.map((unit) => {
                  const unitConcepts = conceptsByUnit.get(unit.id) ?? []
                  if (unitConcepts.length === 0) return null

                  return (
                    <div key={unit.id} className="space-y-1">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-1">
                        {unit.title} ({unitConcepts.length})
                      </h3>
                      <div className="space-y-0.5">
                        {unitConcepts.map((concept) => (
                          <div
                            key={concept.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border text-sm"
                          >
                            <span className="flex-1 font-medium truncate">{concept.title}</span>
                            <LevelChip level={concept.level} />
                            <GrammarFocusChip focus={concept.grammar_focus} />
                            <Link
                              href={`/admin/exercises?concept=${concept.id}`}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              Exercises →
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>

      <Suspense fallback={<AdminCurriculumDeferredSkeleton />}>
        <AdminCurriculumDeferred conceptIds={allConceptIds} />
      </Suspense>
    </div>
  )
}
