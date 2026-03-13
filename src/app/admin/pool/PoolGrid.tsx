'use client'

import { useState } from 'react'
import { Plus, Check, Loader2 } from 'lucide-react'

interface ModuleRow { id: string; title: string; order_index: number }
interface UnitRow { id: string; module_id: string; title: string; order_index: number }
interface ConceptRow { id: string; unit_id: string; title: string }

interface Props {
  modules: ModuleRow[]
  unitsByModule: Record<string, UnitRow[]>
  conceptsByUnit: Record<string, ConceptRow[]>
  counts: Record<string, number>
  cap: number
  allTypes: string[]
  generatableTypes: string[]
}

const TYPE_SHORT_LABELS: Record<string, string> = {
  gap_fill: 'Gap',
  translation: 'Trans',
  transformation: 'Transf',
  error_correction: 'Error',
  sentence_builder: 'Sent.B',
  free_write: 'Free',
}

function countColor(count: number, cap: number): string {
  if (count >= cap) return 'text-green-600 dark:text-green-400'
  if (count >= Math.floor(cap * 0.67)) return 'text-green-600 dark:text-green-400'
  if (count >= Math.floor(cap * 0.33)) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function PoolGrid({ modules, unitsByModule, conceptsByUnit, counts, cap, allTypes, generatableTypes }: Props) {
  const [localCounts, setLocalCounts] = useState<Record<string, number>>(counts)
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  function getCount(conceptId: string, type: string): number {
    return localCounts[`${conceptId}:${type}`] ?? 0
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  async function handleGenerate(conceptId: string, type: string) {
    const key = `${conceptId}:${type}`
    if (generating.has(key)) return

    setGenerating((prev) => new Set(prev).add(key))
    try {
      const res = await fetch('/api/exercises/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept_id: conceptId, type, force: true }),
      })
      if (res.ok) {
        const data = await res.json()
        // Only increment count if this wasn't a cached duplicate
        if (!data.cached) {
          setLocalCounts((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
        }
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      {modules.map((mod) => {
        const modUnits = unitsByModule[mod.id] ?? []
        const isExpanded = expandedModules.has(mod.id)

        return (
          <div key={mod.id} className="border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/70 transition-colors text-left"
            >
              <span className="font-semibold text-sm">{mod.title}</span>
              <span className="text-xs text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[180px]">Concept</th>
                      {allTypes.map((t) => (
                        <th key={t} className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">
                          {TYPE_SHORT_LABELS[t] ?? t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modUnits.map((unit) => {
                      const unitConcepts = conceptsByUnit[unit.id] ?? []
                      return unitConcepts.map((concept, ci) => (
                        <tr key={concept.id} className={`border-b last:border-0 ${ci % 2 === 0 ? '' : 'bg-muted/10'}`}>
                          <td className="px-3 py-2 align-middle">
                            <span className="text-sm">{concept.title}</span>
                          </td>
                          {allTypes.map((type) => {
                            const count = getCount(concept.id, type)
                            const isGeneratable = generatableTypes.includes(type)
                            const atCap = count >= cap
                            const genKey = `${concept.id}:${type}`
                            const isGenerating = generating.has(genKey)

                            return (
                              <td key={type} className="px-2 py-2 align-middle text-center">
                                <span className={`font-mono text-xs ${countColor(count, cap)}`}>
                                  {count}/{cap}
                                </span>
                                {isGeneratable && (
                                  <div className="mt-0.5">
                                    {atCap ? (
                                      <Check className="h-3 w-3 text-green-500 mx-auto" />
                                    ) : isGenerating ? (
                                      <Loader2 className="h-3 w-3 text-muted-foreground mx-auto animate-spin" />
                                    ) : (
                                      <button
                                        onClick={() => handleGenerate(concept.id, type)}
                                        className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-primary/10 text-primary transition-colors"
                                        title={`Generate ${type} for ${concept.title}`}
                                        data-testid={`generate-${concept.id}-${type}`}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
