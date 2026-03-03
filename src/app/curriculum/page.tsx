import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { Trophy } from 'lucide-react'

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

function DifficultyBars({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-3.5 rounded-full ${i <= difficulty ? 'bg-orange-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

const EXERCISE_TYPES = [
  { type: 'gap_fill',         label: 'Gap fill' },
  { type: 'translation',      label: 'Translation' },
  { type: 'transformation',   label: 'Transformation' },
  { type: 'sentence_builder', label: 'Sentence builder' },
  { type: 'error_correction', label: 'Error correction' },
] as const

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
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-10 pb-24 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Curriculum</h1>
          <p className="text-sm text-muted-foreground mt-0.5">B1 → B2 Spanish</p>
        </div>
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
        const masteredPct = allConcepts.length > 0 ? (masteredCount / allConcepts.length) * 100 : 0

        return (
          <section key={mod.id} className="space-y-5">
            {/* Module header */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold">{mod.title}</h2>
                  {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={`/study?module=${mod.id}`}>Practice module</Link>
                </Button>
              </div>
              {/* Module progress bar */}
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${masteredPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  {masteredCount}/{allConcepts.length} mastered
                </p>
              </div>
            </div>

            {/* Units */}
            {modUnits.map((unit) => {
              const unitConcepts = conceptsByUnit.get(unit.id) ?? []
              return (
                <div key={unit.id} className="space-y-2">
                  {/* Unit header */}
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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
                        <div key={concept.id} className="border rounded-xl p-3.5 space-y-3 bg-card shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 min-w-0">
                              <p className="font-semibold text-sm">{concept.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{concept.explanation}</p>
                              <DifficultyBars difficulty={concept.difficulty} />
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
                          {/* Practice buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                              <Link href={`/study?concept=${concept.id}`}>Practice all</Link>
                            </Button>
                            {EXERCISE_TYPES.map(({ type, label }) => (
                              <Button key={type} asChild variant="ghost" size="sm" className="h-7 text-xs">
                                <Link href={`/study?concept=${concept.id}&types=${type}`}>{label}</Link>
                              </Button>
                            ))}
                          </div>
                        </div>
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
