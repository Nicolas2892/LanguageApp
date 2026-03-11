'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, ChevronRight } from 'lucide-react'
import { MASTERY_THRESHOLD } from '@/lib/constants'
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
type MasteryState = 'mastered' | 'learning' | 'new'

interface Props {
  modules: ModuleRow[]
  units: UnitRow[]
  concepts: ConceptRow[]
  progressEntries: ProgressRow[]
  unlockedLevelsList: string[]
}

function getMasteryState(intervalDays: number | undefined): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERY_THRESHOLD) return 'mastered'
  return 'learning'
}

function getModuleState(allModConcepts: ConceptRow[], progressMap: Map<string, ProgressRow>): ModuleState {
  if (allModConcepts.length === 0) return 'upcoming'
  const mastered = allModConcepts.filter(c => (progressMap.get(c.id)?.interval_days ?? -1) >= MASTERY_THRESHOLD).length
  const attempted = allModConcepts.filter(c => progressMap.has(c.id)).length
  if (mastered === allModConcepts.length) return 'mastered'
  if (attempted > 0) return 'active'
  return 'upcoming'
}

const MASTERY_BADGE: Record<MasteryState, { label: string; style: React.CSSProperties }> = {
  mastered: {
    label: 'Dominado',
    style: { background: 'rgba(196,82,46,0.1)', color: 'var(--d5-terracotta)', border: '1px solid rgba(196,82,46,0.2)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 600 },
  },
  learning: {
    label: 'Aprendiendo',
    style: { background: 'rgba(59,130,246,0.08)', color: 'rgb(59,130,246)', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 600 },
  },
  new: {
    label: 'Nuevo',
    style: { background: 'transparent', color: 'rgba(26,17,8,0.4)', border: '1px solid rgba(26,17,8,0.15)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 600 },
  },
}

export function CurriculumClient({ modules, units, concepts, progressEntries, unlockedLevelsList }: Props) {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null)

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

  function isLocked(concept: ConceptRow): boolean {
    return !unlockedLevels.has(concept.level ?? 'B1')
  }

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-lora), serif',
            fontStyle: 'italic',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--d5-ink)',
            lineHeight: 1.15,
          }}
        >
          Tu Currículo
        </h1>
        <p style={{ fontSize: 11, color: 'var(--d5-warm)', marginTop: 4 }}>B1 → B2 · Tu camino personal</p>
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
          const nodeSize = state === 'active' ? 16 : 11
          const nodeStyle: React.CSSProperties =
            state === 'mastered'
              ? { width: nodeSize, height: nodeSize, borderRadius: '50%', background: 'var(--d5-muted)', flexShrink: 0 }
              : state === 'active'
              ? {
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: '50%',
                  border: '2px solid var(--d5-terracotta)',
                  boxShadow: '0 0 0 5px rgba(196,82,46,0.09)',
                  background: 'var(--d5-paper)',
                  flexShrink: 0,
                }
              : { width: nodeSize, height: nodeSize, borderRadius: '50%', border: '1.5px solid rgba(26,17,8,0.25)', background: 'transparent', flexShrink: 0 }

          // Title size per state (all use senda-heading font)
          const titleFontSize = state === 'active' ? 15 : 13

          // Status chip per state
          const statusChip =
            state === 'mastered'
              ? { label: 'Completado', style: { background: 'rgba(184,170,153,0.3)', color: 'var(--d5-muted)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 500 } as React.CSSProperties }
              : state === 'active'
              ? { label: 'En Progreso', style: { background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 500 } as React.CSSProperties }
              : { label: 'Próximamente', style: { color: 'rgba(26,17,8,0.35)', fontSize: 10, fontWeight: 400, padding: '2px 7px' } as React.CSSProperties }

          const lineColor = idx === 1 ? 'var(--d5-muted)' : 'rgba(26,17,8,0.12)'

          return (
            <div key={mod.id} style={{ display: 'flex' }}>
              {/* Left gutter */}
              <div style={{ width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {/* Line above node */}
                {!isFirst ? (
                  <div style={{ width: 1.5, height: 24, background: lineColor, marginBottom: 4 }} />
                ) : (
                  <div style={{ height: 8 }} />
                )}
                {/* Node */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: nodeSize }}>
                  <div style={nodeStyle} />
                </div>
                {/* Line below node */}
                {!isLast && (
                  <div style={{ width: 1.5, flex: 1, minHeight: 24, background: 'rgba(26,17,8,0.12)', marginTop: 4 }} />
                )}
              </div>

              {/* Content area — senda-card */}
              <div
                className="senda-card"
                style={{
                  flex: 1,
                  marginLeft: 16,
                  marginBottom: isLast ? 16 : 24,
                  marginTop: isFirst ? 0 : 4,
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
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 7px',
                          borderRadius: 9999,
                          border: '1px solid rgba(26,17,8,0.15)',
                          fontSize: 10,
                          color: 'var(--d5-warm)',
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
                </div>

                {/* Progress bar */}
                {state !== 'upcoming' && (
                  <div
                    style={{
                      marginTop: 10,
                      height: 3,
                      borderRadius: 999,
                      background: 'rgba(26,17,8,0.08)',
                      width: '58%',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${masteredPct}%`,
                        borderRadius: 999,
                        background: state === 'active' ? 'var(--d5-terracotta)' : 'var(--d5-muted)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                )}

                {/* Expanded concept rows */}
                {isExpanded && (
                  <div style={{ marginTop: 16 }}>
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
                                marginTop: unitIdx === 0 ? 0 : 14,
                                marginBottom: 6,
                              }}
                            >
                              <span className="senda-eyebrow" style={{ fontSize: 8 }}>
                                {unit.title}
                              </span>
                              <div style={{ flex: 1, height: 1, background: 'rgba(196,82,46,0.12)' }} />
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
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: 10,
                                    paddingLeft: 20,
                                    borderLeft: '2px solid rgba(196,82,46,0.15)',
                                    opacity: locked ? 0.4 : 1,
                                    gap: 8,
                                  }}
                                >
                                  {/* Left: icon + title + dot + chips */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                    {locked && (
                                      <Lock
                                        size={12}
                                        strokeWidth={1.5}
                                        style={{ flexShrink: 0, color: 'var(--d5-muted)' }}
                                      />
                                    )}
                                    <span
                                      style={{
                                        fontSize: 14,
                                        color: 'var(--d5-ink)',
                                        fontWeight: 400,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {concept.title}
                                    </span>
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
                                    <LevelChip level={concept.level} />
                                    <GrammarFocusChip focus={concept.grammar_focus} />
                                  </div>
                                  {/* Right: badge + flag + chevron */}
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
                                      style={{ color: 'rgba(26,17,8,0.4)', flexShrink: 0 }}
                                    />
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                )}
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
          color: 'var(--d5-warm)',
          marginTop: 8,
          fontStyle: 'italic',
        }}
      >
        tu senda continúa…
      </p>
    </main>
  )
}
