'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, ChevronRight, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { getMasteryState, MASTERY_BADGE } from '@/lib/mastery/badge'
import { LevelChip } from '@/components/LevelChip'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { HardFlagButton } from '@/components/HardFlagButton'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'

type ModuleRow  = { id: string; title: string; order_index: number }
type UnitRow    = { id: string; module_id: string; title: string; order_index: number }
type ConceptRow = { id: string; unit_id: string; title: string; difficulty: number; level: string | null; grammar_focus: string | null }
type ProgressRow = { concept_id: string; interval_days: number; is_hard: boolean }
type ModuleState = 'mastered' | 'active' | 'upcoming'

interface Props {
  modules: ModuleRow[]
  units: UnitRow[]
  concepts: ConceptRow[]
  progressEntries: ProgressRow[]
  unlockedLevelsList: string[]
}

function getModuleState(allModConcepts: ConceptRow[], progressMap: Map<string, ProgressRow>): ModuleState {
  if (allModConcepts.length === 0) return 'upcoming'
  const mastered = allModConcepts.filter(c => (progressMap.get(c.id)?.interval_days ?? -1) >= MASTERY_THRESHOLD).length
  const attempted = allModConcepts.filter(c => progressMap.has(c.id)).length
  if (mastered === allModConcepts.length) return 'mastered'
  if (attempted > 0) return 'active'
  return 'upcoming'
}

export function CurriculumClient({ modules, units, concepts, progressEntries, unlockedLevelsList }: Props) {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null)
  const [celebratingModule, setCelebratingModule] = useState<{ id: string; title: string } | null>(null)

  const progressMap = new Map(progressEntries.map(p => [p.concept_id, p]))
  const unlockedLevels = new Set(unlockedLevelsList)

  const unitsByModule = new Map<string, UnitRow[]>()
  const conceptsByUnit = new Map<string, ConceptRow[]>()
  for (const u of units) {
    const arr = unitsByModule.get(u.module_id) ?? []
    arr.push(u)
    unitsByModule.set(u.module_id, arr)
  }
  for (const c of concepts) {
    const arr = conceptsByUnit.get(c.unit_id) ?? []
    arr.push(c)
    conceptsByUnit.set(c.unit_id, arr)
  }

  // Module completion celebration
  useEffect(() => {
    const unitsByMod = new Map<string, UnitRow[]>()
    const conceptsByU = new Map<string, ConceptRow[]>()
    for (const u of units) {
      const arr = unitsByMod.get(u.module_id) ?? []
      arr.push(u)
      unitsByMod.set(u.module_id, arr)
    }
    for (const c of concepts) {
      const arr = conceptsByU.get(c.unit_id) ?? []
      arr.push(c)
      conceptsByU.set(c.unit_id, arr)
    }

    for (const mod of modules) {
      const modUnits = unitsByMod.get(mod.id) ?? []
      const allConcepts = modUnits.flatMap(u => conceptsByU.get(u.id) ?? [])
      const state = getModuleState(allConcepts, progressMap)
      if (state !== 'mastered') continue

      const key = `module_completed_${mod.id}_seen`
      try {
        if (localStorage.getItem(key)) continue
        setCelebratingModule({ id: mod.id, title: mod.title })
        break
      } catch {
        // ignore
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismissModuleCelebration() {
    if (celebratingModule) {
      try {
        localStorage.setItem(`module_completed_${celebratingModule.id}_seen`, '1')
      } catch {
        // ignore
      }
    }
    setCelebratingModule(null)
  }

  function isLocked(concept: ConceptRow): boolean {
    return !unlockedLevels.has(concept.level ?? 'B1')
  }

  return (
    <>
      {/* Module completion celebration dialog */}
      <Dialog open={!!celebratingModule} onOpenChange={(open) => { if (!open) dismissModuleCelebration() }}>
        <DialogContent className="text-center max-w-sm">
          <DialogHeader className="items-center gap-3">
            <div className="text-4xl">🏆</div>
            <DialogTitle className="senda-heading text-xl">¡Módulo completado!</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--d5-body)' }}>
            Has dominado todos los conceptos de{' '}
            <span className="font-semibold text-foreground">{celebratingModule?.title}</span>.
          </p>
          <DialogFooter className="sm:justify-center">
            <Button onClick={dismissModuleCelebration} className="w-full sm:w-auto">
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 animate-page-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="senda-heading" style={{ fontSize: '1.625rem' }}>
          Tu Currículo
        </h1>
        <p style={{ fontSize: '0.6875rem', color: 'var(--d5-body)', marginTop: '0.25rem' }}>B1 → B2 · Tu camino personal</p>
      </div>

      {/* Timeline */}
      <div>
        {modules.map((mod, idx) => {
          const modUnits = unitsByModule.get(mod.id) ?? []
          const allModConcepts = modUnits.flatMap(u => conceptsByUnit.get(u.id) ?? [])
          const masteredCount = allModConcepts.filter(
            c => (progressMap.get(c.id)?.interval_days ?? -1) >= MASTERY_THRESHOLD
          ).length
          const masteredPct = allModConcepts.length > 0 ? (masteredCount / allModConcepts.length) * 100 : 0
          const state = getModuleState(allModConcepts, progressMap)
          const isExpanded = expandedModuleId === mod.id
          const isFirst = idx === 0
          const isLast = idx === modules.length - 1

          // Node style per state
          const nodeSize = state === 'active' ? '1rem' : '0.6875rem'
          const nodeStyle: React.CSSProperties =
            state === 'mastered'
              ? { width: nodeSize, height: nodeSize, borderRadius: '50%', background: 'var(--d5-subtle)', flexShrink: 0 }
              : state === 'active'
              ? {
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: '50%',
                  border: '2px solid var(--d5-terracotta)',
                  boxShadow: '0 0 0 0.3125rem rgba(196,82,46,0.09)',
                  background: 'var(--background)',
                  flexShrink: 0,
                }
              : { width: nodeSize, height: nodeSize, borderRadius: '50%', border: '1.5px solid var(--d5-border-subtle)', background: 'transparent', flexShrink: 0 }

          // Title size per state (all use senda-heading font)
          const titleFontSize = state === 'active' ? 15 : 13

          // Status chip per state
          const statusChip =
            state === 'mastered'
              ? { label: 'Completado', style: { background: 'var(--d5-surface-tint)', color: 'var(--d5-subtle)', padding: '0.125rem 0.4375rem', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 500 } as React.CSSProperties }
              : state === 'active'
              ? { label: 'En Progreso', style: { background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', padding: '0.125rem 0.4375rem', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 500 } as React.CSSProperties }
              : { label: 'Próximamente', style: { color: 'var(--d5-pill-text-soft)', fontSize: '0.625rem', fontWeight: 400, padding: '0.125rem 0.4375rem' } as React.CSSProperties }

          const lineColor = idx === 1 ? 'var(--d5-subtle)' : 'var(--d5-line)'

          return (
            <div key={mod.id} style={{ display: 'flex' }}>
              {/* Left gutter */}
              <div style={{ width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {/* Line above node */}
                {!isFirst ? (
                  <div style={{ width: 1.5, height: '1.5rem', background: lineColor, marginBottom: '0.25rem' }} />
                ) : (
                  <div style={{ height: 8 }} />
                )}
                {/* Node */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: nodeSize }}>
                  <div style={nodeStyle} />
                </div>
                {/* Line below node */}
                {!isLast && (
                  <div style={{ width: 1.5, flex: 1, minHeight: 24, background: 'var(--d5-line)', marginTop: 4 }} />
                )}
              </div>

              {/* Content area — senda-card */}
              <div
                className="senda-card"
                style={{
                  flex: 1,
                  marginLeft: '1rem',
                  marginBottom: isLast ? '1rem' : '1.5rem',
                  marginTop: isFirst ? 0 : '0.25rem',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
              >
                <BackgroundMagicS opacity={0.05} />

                {/* Title + status + practice row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="senda-heading"
                        style={{ fontSize: titleFontSize }}
                      >
                        {mod.title}
                      </span>
                      <span style={statusChip.style}>{statusChip.label}</span>
                    </div>
                    {/* Meta chip with terracotta dot */}
                    <div style={{ marginTop: '0.375rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 7px',
                          borderRadius: 9999,
                          border: '1px solid var(--d5-border-subtle)',
                          fontSize: '0.625rem',
                          color: 'var(--d5-body)',
                          fontWeight: 400,
                        }}
                      >
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: 'var(--d5-terracotta)',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        {masteredCount}/{allModConcepts.length} Dominados
                      </span>
                    </div>
                  </div>
                  {/* Module practice link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Link
                      href={`/study?practice=true&module=${mod.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        color: 'var(--d5-terracotta)',
                        fontSize: 12,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        padding: '4px 0',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 10,
                      }}
                    >
                      Practicar →
                    </Link>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      style={{
                        color: 'var(--d5-ink)',
                        opacity: 0.35,
                        transition: 'transform 200ms ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                </div>

                {/* Progress bar */}
                {state !== 'upcoming' && (
                  <div
                    style={{
                      marginTop: '0.625rem',
                      height: 3,
                      borderRadius: 999,
                      background: 'var(--d5-line)',
                      width: '58%',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${masteredPct}%`,
                        borderRadius: 999,
                        background: state === 'active' ? 'var(--d5-terracotta)' : 'var(--d5-subtle)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                )}

                {/* Expanded concept rows — animated accordion */}
                <div
                  className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
                  style={{
                    maxHeight: isExpanded ? '120rem' : '0',
                    opacity: isExpanded ? 1 : 0,
                  }}
                  aria-hidden={!isExpanded}
                >
                  <div style={{ marginTop: 16, pointerEvents: isExpanded ? 'auto' : 'none' }}>
                    {(() => {
                      const nonEmptyUnits = modUnits.filter(u => (conceptsByUnit.get(u.id) ?? []).length > 0)
                      const showUnitHeaders = nonEmptyUnits.length > 1
                      return nonEmptyUnits.map((unit, unitIdx) => (
                        <div key={unit.id}>
                          {showUnitHeaders && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: unitIdx === 0 ? 0 : '0.875rem',
                                marginBottom: '0.375rem',
                              }}
                            >
                              <span className="senda-eyebrow" style={{ fontSize: '0.5rem' }}>
                                {unit.title}
                              </span>
                              <div style={{ flex: 1, height: '0.0625rem', background: 'rgba(196,82,46,0.12)' }} />
                            </div>
                          )}
                          {(conceptsByUnit.get(unit.id) ?? []).map(concept => {
                            const p = progressMap.get(concept.id)
                            const masteryState = getMasteryState(p?.interval_days)
                            const badge = MASTERY_BADGE[masteryState]
                            const locked = isLocked(concept)
                            const isHard = p?.is_hard ?? false

                            return (
                              <Link
                                key={concept.id}
                                href={`/curriculum/${concept.id}`}
                                onClick={e => e.stopPropagation()}
                                style={{ display: 'block', position: 'relative', zIndex: 10 }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                    marginTop: '0.625rem',
                                    paddingLeft: '1.25rem',
                                    borderLeft: '2px solid rgba(196,82,46,0.15)',
                                    opacity: locked ? 0.4 : 1,
                                  }}
                                >
                                  {/* Row 1: icon + title + right section */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                      {locked && (
                                        <Lock
                                          size={12}
                                          strokeWidth={1.5}
                                          style={{ flexShrink: 0, color: 'var(--d5-subtle)' }}
                                        />
                                      )}
                                      <span
                                        className="text-foreground"
                                        style={{
                                          fontSize: 14,
                                          fontWeight: 400,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {concept.title}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                      <span style={badge.style}>{badge.label}</span>
                                      <div
                                        onClick={e => e.stopPropagation()}
                                        style={{ position: 'relative', zIndex: 20 }}
                                      >
                                        <HardFlagButton conceptId={concept.id} initialIsHard={isHard} />
                                      </div>
                                      <ChevronRight
                                        size={14}
                                        strokeWidth={1.5}
                                        style={{ color: 'var(--d5-pill-text-soft)', flexShrink: 0 }}
                                      />
                                    </div>
                                  </div>
                                  {/* Row 2: chips below title */}
                                  {(concept.level || concept.grammar_focus) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: locked ? 18 : 0 }}>
                                      <LevelChip level={concept.level} />
                                      <GrammarFocusChip focus={concept.grammar_focus} />
                                    </div>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <WindingPathSeparator />
      <p
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--d5-body)',
          marginTop: 8,
          fontStyle: 'italic',
        }}
      >
        tu senda continúa…
      </p>
    </main>
    </>
  )
}
