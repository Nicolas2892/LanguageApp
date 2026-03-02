import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { MASTERY_THRESHOLD } from '@/lib/constants'

const MASTERED_THRESHOLD = MASTERY_THRESHOLD

type MasteryState = 'mastered' | 'learning' | 'seen' | 'new'

function getMasteryState(intervalDays: number | undefined): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERED_THRESHOLD) return 'mastered'
  if (intervalDays >= 7) return 'learning'
  return 'seen'
}

const MASTERY_BADGE: Record<MasteryState, { label: string; className: string }> = {
  mastered: { label: 'Mastered', className: 'bg-green-100 text-green-800 border-green-200' },
  learning: { label: 'Learning', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  seen:     { label: 'Seen',     className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  new:      { label: 'New',      className: 'bg-muted text-muted-foreground border-transparent' },
}

const DIFFICULTY_DOTS: Record<number, string> = {
  1: '●○○○○', 2: '●●○○○', 3: '●●●○○', 4: '●●●●○', 5: '●●●●●',
}

export default async function CurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: modules } = await supabase
    .from('modules').select('id, title, description, order_index').order('order_index')
  const { data: units } = await supabase
    .from('units').select('id, module_id, title, order_index').order('order_index')
  const { data: concepts } = await supabase
    .from('concepts').select('id, unit_id, title, explanation, difficulty, type').order('difficulty')
  const { data: progressRows } = await supabase
    .from('user_progress').select('concept_id, interval_days, repetitions').eq('user_id', user.id)

  type ModuleRow = { id: string; title: string; description: string | null; order_index: number }
  type UnitRow   = { id: string; module_id: string; title: string; order_index: number }
  type ConceptRow = { id: string; unit_id: string; title: string; explanation: string; difficulty: number; type: string }
  type ProgressRow = { concept_id: string; interval_days: number; repetitions: number }

  const typedModules  = (modules  ?? []) as ModuleRow[]
  const typedUnits    = (units    ?? []) as UnitRow[]
  const typedConcepts = (concepts ?? []) as ConceptRow[]
  const progressMap   = new Map(((progressRows ?? []) as ProgressRow[]).map((p) => [p.concept_id, p]))

  const unitsByModule   = new Map<string, UnitRow[]>()
  const conceptsByUnit  = new Map<string, ConceptRow[]>()
  for (const u of typedUnits) {
    const arr = unitsByModule.get(u.module_id) ?? []; arr.push(u); unitsByModule.set(u.module_id, arr)
  }
  for (const c of typedConcepts) {
    const arr = conceptsByUnit.get(c.unit_id) ?? []; arr.push(c); conceptsByUnit.set(c.unit_id, arr)
  }

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Curriculum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">B1 → B2 Spanish</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(MASTERY_BADGE) as [MasteryState, typeof MASTERY_BADGE[MasteryState]][]).map(([state, cfg]) => (
          <span key={state} className={`inline-flex items-center px-2 py-0.5 rounded-full border ${cfg.className}`}>
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Modules */}
      {typedModules.map((mod) => {
        const modUnits    = unitsByModule.get(mod.id) ?? []
        const allConcepts = modUnits.flatMap((u) => conceptsByUnit.get(u.id) ?? [])
        const masteredCount = allConcepts.filter(
          (c) => (progressMap.get(c.id)?.interval_days ?? 0) >= MASTERED_THRESHOLD
        ).length

        return (
          <section key={mod.id} className="space-y-5">
            {/* Module header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold">{mod.title}</h2>
                {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                <p className="text-xs text-muted-foreground">{masteredCount}/{allConcepts.length} mastered</p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/study?module=${mod.id}`}>Practice module</Link>
              </Button>
            </div>

            {/* Units */}
            {modUnits.map((unit) => {
              const unitConcepts = conceptsByUnit.get(unit.id) ?? []
              return (
                <div key={unit.id} className="space-y-2">
                  {/* Unit header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {unit.title}
                    </h3>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                      <Link href={`/study?unit=${unit.id}`}>Practice unit →</Link>
                    </Button>
                  </div>

                  {/* Concepts */}
                  <div className="space-y-2">
                    {unitConcepts.map((concept) => {
                      const progress = progressMap.get(concept.id)
                      const state = getMasteryState(progress?.interval_days)
                      const cfg = MASTERY_BADGE[state]

                      return (
                        <Link
                          key={concept.id}
                          href={`/study?concept=${concept.id}`}
                          className="block border rounded-lg p-3.5 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-medium text-sm group-hover:underline">{concept.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{concept.explanation}</p>
                              <p className="text-xs text-muted-foreground mt-1 font-mono tracking-tight">
                                {DIFFICULTY_DOTS[concept.difficulty] ?? ''}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${cfg.className}`}>
                                {cfg.label}
                              </span>
                              {progress && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  next in {progress.interval_days}d
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </main>
  )
}
