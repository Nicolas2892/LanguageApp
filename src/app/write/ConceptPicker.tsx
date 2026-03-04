'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { Dices, Trophy } from 'lucide-react'

interface ConceptRow {
  id: string
  unit_id: string
  title: string
  difficulty: number
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

const MASTERY_THRESHOLD = 21

function DifficultyBars({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-4 rounded-full ${i <= difficulty ? 'bg-orange-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

function getDifficultyLabel(count: number): string {
  if (count === 1) return 'Focused — single concept'
  if (count === 2) return 'Synthesis — two structures'
  return 'Challenge — multi-concept'
}

export function ConceptPicker({ modules, units, concepts, suggestedId }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(
    suggestedId ? new Set([suggestedId]) : new Set()
  )

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

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function surpriseMe() {
    const count = Math.floor(Math.random() * 3) + 1
    const shuffled = [...concepts].sort(() => Math.random() - 0.5)
    setSelected(new Set(shuffled.slice(0, count).map((c) => c.id)))
  }

  function handleStart() {
    if (selected.size === 0) return
    router.push(`/write?concepts=${[...selected].join(',')}`)
  }

  const selectedCount = selected.size

  return (
    <div className="space-y-6 pb-36">
      {/* Concept list grouped by module → unit */}
      {modules.map((mod) => {
        const modUnits = unitsByModule.get(mod.id) ?? []
        return (
          <section key={mod.id} className="space-y-4">
            <h2 className="text-base font-bold">{mod.title}</h2>
            {modUnits.map((unit) => {
              const unitConcepts = conceptsByUnit.get(unit.id) ?? []
              return (
                <div key={unit.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {unit.title}
                  </p>
                  <div className="space-y-2">
                    {unitConcepts.map((concept) => {
                      const isMastered = (concept.interval_days ?? 0) >= MASTERY_THRESHOLD
                      const isChecked = selected.has(concept.id)
                      return (
                        <label
                          key={concept.id}
                          className={`flex items-start gap-3 border rounded-xl p-3.5 cursor-pointer transition-colors ${
                            isChecked
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 shrink-0 accent-orange-500"
                            checked={isChecked}
                            onChange={() => toggle(concept.id)}
                          />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <p className="text-sm font-medium leading-snug">{concept.title}</p>
                            <DifficultyBars difficulty={concept.difficulty} />
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <GrammarFocusChip focus={concept.grammar_focus} />
                            {isMastered && (
                              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                <Trophy className="h-3 w-3" />
                                Mastered
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
          </section>
        )
      })}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {selectedCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedCount} concept{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <span className="font-semibold text-orange-700">{getDifficultyLabel(selectedCount)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={surpriseMe} className="shrink-0 gap-1.5">
              <Dices className="h-4 w-4" />
              Surprise me
            </Button>
            <Button
              onClick={handleStart}
              disabled={selectedCount === 0}
              className="flex-1 active:scale-95 transition-transform"
            >
              Start writing →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
