'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { LevelChip } from '@/components/LevelChip'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { Dices, ChevronRight } from 'lucide-react'

interface ConceptRow {
  id: string
  unit_id: string
  title: string
  difficulty: number
  level?: string | null
  grammar_focus?: string | null
  interval_days?: number
}

interface UnitRow {
  id: string
  module_id: string
  title: string
}

interface ModuleRow {
  id: string
  title: string
}

interface Props {
  modules: ModuleRow[]
  units: UnitRow[]
  concepts: ConceptRow[]
  suggestedId: string | null
}

type MasteryFilter = 'all' | 'new' | 'learning' | 'mastered'

function getDifficultyLabel(count: number): string {
  if (count === 1) return 'Focused — one concept'
  if (count === 2) return 'Synthesis — two structures'
  return 'Challenge — multiple structures'
}

const MASTERY_BADGE: Record<'mastered' | 'learning', string> = {
  mastered: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
  learning: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-800',
}

export function ConceptPicker({ modules, units, concepts, suggestedId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(
    suggestedId ? new Set([suggestedId]) : new Set()
  )
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all')

  const unitsByModule = new Map<string, UnitRow[]>()
  for (const u of units) {
    const arr = unitsByModule.get(u.module_id) ?? []
    arr.push(u)
    unitsByModule.set(u.module_id, arr)
  }

  const conceptsByUnit = new Map<string, ConceptRow[]>()
  for (const c of concepts) {
    const arr = conceptsByUnit.get(c.unit_id) ?? []
    arr.push(c)
    conceptsByUnit.set(c.unit_id, arr)
  }

  function getMasteryState(intervalDays?: number): 'mastered' | 'learning' | 'new' {
    if (intervalDays === undefined) return 'new'
    if (intervalDays >= MASTERY_THRESHOLD) return 'mastered'
    return 'learning'
  }

  function matchesMasteryFilter(concept: ConceptRow): boolean {
    if (masteryFilter === 'all') return true
    return getMasteryState(concept.interval_days) === masteryFilter
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearAll() {
    setSelected(new Set())
  }

  function surpriseMe() {
    const count = Math.floor(Math.random() * 3) + 1
    const learning = concepts.filter(
      (c) => c.interval_days !== undefined && c.interval_days < MASTERY_THRESHOLD
    )
    const pool = learning.length >= count ? learning : concepts
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setSelected(new Set(shuffled.slice(0, count).map((c) => c.id)))
  }

  function handleStart() {
    if (selected.size === 0) return
    router.push(`/write?concepts=${[...selected].join(',')}`)
  }

  const selectedCount = selected.size

  const suggestedModuleId = (() => {
    if (!suggestedId) return null
    const unit = units.find((u) => conceptsByUnit.get(u.id)?.some((c) => c.id === suggestedId))
    return unit?.module_id ?? null
  })()

  const globalEmptyState =
    masteryFilter !== 'all' &&
    modules.every(
      (mod) =>
        (unitsByModule.get(mod.id) ?? [])
          .flatMap((u) => conceptsByUnit.get(u.id) ?? [])
          .filter(matchesMasteryFilter).length === 0
    )

  return (
    <div className="space-y-4 pb-36">
      {/* Mastery filter chip row */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['all', 'new', 'learning', 'mastered'] as MasteryFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setMasteryFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              masteryFilter === f
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {selectedCount > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* "Surprise me" prominent card */}
      <div className="border rounded-xl bg-card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Not sure where to start?</p>
          <p className="text-xs text-muted-foreground mt-0.5">We&apos;ll pick 1–3 concepts for you</p>
        </div>
        <Button variant="outline" onClick={surpriseMe} className="shrink-0 gap-1.5">
          <Dices className="h-4 w-4" />
          Surprise me
        </Button>
      </div>

      {/* Global empty state when filter active and nothing matches */}
      {globalEmptyState && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No {masteryFilter} concepts yet.{' '}
          <button onClick={() => setMasteryFilter('all')} className="underline">
            Show all
          </button>
        </p>
      )}

      {/* Module accordions */}
      {modules.map((mod) => {
        const modUnits = unitsByModule.get(mod.id) ?? []
        const allModConcepts = modUnits.flatMap((u) => conceptsByUnit.get(u.id) ?? [])
        const filteredCount = allModConcepts.filter(matchesMasteryFilter).length
        const masteredCount = allModConcepts.filter(
          (c) => getMasteryState(c.interval_days) === 'mastered'
        ).length

        if (masteryFilter !== 'all' && filteredCount === 0) return null

        return (
          <details
            key={mod.id}
            open={suggestedModuleId === mod.id}
            className="group border rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer p-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-bold leading-snug">{mod.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {masteredCount}/{allModConcepts.length} mastered
                  </p>
                </div>
              </div>
            </summary>

            <div className="px-4 pb-4 pt-2 space-y-4 border-t">
              {modUnits.map((unit) => {
                const unitConcepts = (conceptsByUnit.get(unit.id) ?? []).filter(
                  matchesMasteryFilter
                )
                if (unitConcepts.length === 0) return null
                return (
                  <div key={unit.id} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground py-1">
                      {unit.title}
                    </p>
                    <div className="space-y-2">
                      {unitConcepts.map((concept) => {
                        const masteryState = getMasteryState(concept.interval_days)
                        const isChecked = selected.has(concept.id)
                        return (
                          <label
                            key={concept.id}
                            className={`flex items-start gap-3 border rounded-xl p-3.5 cursor-pointer transition-colors ${
                              isChecked
                                ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
                                : 'border-border bg-background hover:bg-muted/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 shrink-0 accent-green-700"
                              checked={isChecked}
                              onChange={() => toggle(concept.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug">{concept.title}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                              <LevelChip level={concept.level} />
                              <GrammarFocusChip focus={concept.grammar_focus} />
                              {masteryState !== 'new' && (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${MASTERY_BADGE[masteryState]}`}
                                >
                                  {masteryState === 'mastered' ? 'Mastered' : 'Learning'}
                                </span>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )
      })}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[220px] bg-background/95 backdrop-blur-sm border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          {selectedCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedCount} concept{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <span className="font-semibold text-green-800">{getDifficultyLabel(selectedCount)}</span>
            </div>
          )}
          <Button
            onClick={handleStart}
            disabled={selectedCount === 0}
            className="w-full active:scale-95 transition-transform"
          >
            Start writing →
          </Button>
        </div>
      </div>
    </div>
  )
}
