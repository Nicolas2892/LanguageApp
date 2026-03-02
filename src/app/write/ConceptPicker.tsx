'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ConceptRow {
  id: string
  unit_id: string
  title: string
  difficulty: number
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

const DIFFICULTY_DOTS: Record<number, string> = {
  1: '●○○○○', 2: '●●○○○', 3: '●●●○○', 4: '●●●●○', 5: '●●●●●',
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
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
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
    <div className="space-y-6 pb-32">
      {/* Concept list grouped by module → unit */}
      {modules.map((mod) => {
        const modUnits = unitsByModule.get(mod.id) ?? []
        return (
          <section key={mod.id} className="space-y-4">
            <h2 className="text-base font-semibold">{mod.title}</h2>
            {modUnits.map((unit) => {
              const unitConcepts = conceptsByUnit.get(unit.id) ?? []
              return (
                <div key={unit.id} className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {unit.title}
                  </p>
                  <div className="space-y-1.5">
                    {unitConcepts.map((concept) => {
                      const isMastered = (concept.interval_days ?? 0) >= MASTERY_THRESHOLD
                      const isChecked = selected.has(concept.id)
                      return (
                        <label
                          key={concept.id}
                          className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                            isChecked ? 'border-foreground bg-muted/30' : 'hover:bg-muted/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 shrink-0"
                            checked={isChecked}
                            onChange={() => toggle(concept.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{concept.title}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                              {DIFFICULTY_DOTS[concept.difficulty] ?? ''}
                            </p>
                          </div>
                          {isMastered && (
                            <span className="text-xs shrink-0 px-1.5 py-0.5 rounded-full border bg-green-100 text-green-800 border-green-200">
                              Mastered
                            </span>
                          )}
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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-inset-bottom">
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {selectedCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedCount} concept{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <span className="font-medium">{getDifficultyLabel(selectedCount)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={surpriseMe} className="shrink-0">
              Surprise me 🎲
            </Button>
            <Button
              onClick={handleStart}
              disabled={selectedCount === 0}
              className="flex-1"
            >
              Start writing →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
