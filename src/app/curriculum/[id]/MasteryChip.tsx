'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { PRODUCTION_CORRECT_REQUIRED, PRODUCTION_TYPES_REQUIRED } from '@/lib/mastery/badge'

interface Milestones {
  srsReady: boolean
  intervalDays: number
  correctNonGapFill: number
  uniqueTypes: number
  correctProductionTypeLabels: string[]
}

export interface MasteryChipProps {
  masteryState: 'new' | 'learning' | 'mastered'
  badge: { label: string; style: React.CSSProperties }
  nudgeText: string | null
  milestones: Milestones | null
}

export function MasteryChip({ masteryState, badge, nudgeText, milestones }: MasteryChipProps) {
  const [expanded, setExpanded] = useState(false)
  const isExpandable = masteryState === 'learning' && milestones !== null

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={isExpandable ? () => setExpanded((v) => !v) : undefined}
          className="inline-flex items-center gap-0.5"
          style={{
            ...badge.style,
            cursor: isExpandable ? 'pointer' : 'default',
            userSelect: 'none',
          }}
          aria-expanded={isExpandable ? expanded : undefined}
          data-testid="mastery-chip"
          data-state={masteryState}
        >
          {badge.label}
          {isExpandable && (
            <ChevronDown
              size={12}
              strokeWidth={2}
              data-testid="chevron"
              style={{
                transition: 'transform 200ms ease',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </button>
      </div>

      {nudgeText && (
        <p
          className="text-xs mt-1.5"
          style={{ color: 'var(--d5-warm)' }}
          data-testid="nudge-text"
        >
          {nudgeText}
        </p>
      )}

      {isExpandable && milestones && (
        <div
          style={{
            maxHeight: expanded ? '10rem' : '0',
            overflow: 'hidden',
            transition: 'max-height 200ms ease',
          }}
          data-testid="milestones"
        >
          <div className="flex flex-col gap-1.5 pt-2">
            {/* SRS milestone */}
            <div className="flex items-center gap-2">
              {milestones.srsReady ? (
                <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} data-testid="icon-check-srs" />
              ) : (
                <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)', flexShrink: 0 }} data-testid="icon-circle-srs" />
              )}
              <p className="text-xs text-foreground">
                Retención SRS
                <span className="ml-1.5" style={{ color: 'var(--d5-warm)' }}>
                  {Math.min(milestones.intervalDays, MASTERY_THRESHOLD)}/{MASTERY_THRESHOLD} días
                </span>
              </p>
            </div>

            {/* Production breadth — correct attempts */}
            <div className="flex items-center gap-2">
              {milestones.correctNonGapFill >= PRODUCTION_CORRECT_REQUIRED ? (
                <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} data-testid="icon-check-production" />
              ) : (
                <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)', flexShrink: 0 }} data-testid="icon-circle-production" />
              )}
              <p className="text-xs text-foreground">
                Producción
                <span className="ml-1.5" style={{ color: 'var(--d5-warm)' }}>
                  {milestones.correctNonGapFill}/{PRODUCTION_CORRECT_REQUIRED} correctas
                </span>
              </p>
            </div>

            {/* Production breadth — unique types */}
            <div className="flex items-center gap-2">
              {milestones.uniqueTypes >= PRODUCTION_TYPES_REQUIRED ? (
                <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} data-testid="icon-check-variety" />
              ) : (
                <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)', flexShrink: 0 }} data-testid="icon-circle-variety" />
              )}
              <div className="flex-1">
                <p className="text-xs text-foreground">
                  Variedad
                  <span className="ml-1.5" style={{ color: 'var(--d5-warm)' }}>
                    {milestones.uniqueTypes}/{PRODUCTION_TYPES_REQUIRED} tipos
                  </span>
                </p>
                {milestones.correctProductionTypeLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {milestones.correctProductionTypeLabels.map((label) => (
                      <span
                        key={label}
                        data-testid="type-chip"
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 9999,
                          background: 'rgba(196,82,46,0.1)',
                          color: 'var(--d5-terracotta)',
                          fontWeight: 500,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
