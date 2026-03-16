import { MASTERY_THRESHOLD } from '../constants'

export type MasteryState = 'mastered' | 'learning' | 'new'

/** Required correct non-gap_fill attempts for production gate */
export const PRODUCTION_CORRECT_REQUIRED = 3
/** Required distinct non-gap_fill types for production gate */
export const PRODUCTION_TYPES_REQUIRED = 2

export interface MasteryProgress {
  srsReady: boolean
  correctNonGapFill: number
  uniqueTypes: number
  productionReady: boolean
  mastered: boolean
}

/**
 * Compute detailed mastery progress for a concept.
 */
export function getMasteryProgress(
  intervalDays: number | undefined,
  correctNonGapFill: number,
  uniqueTypes: number,
): MasteryProgress {
  const srsReady = (intervalDays ?? 0) >= MASTERY_THRESHOLD
  const productionReady =
    correctNonGapFill >= PRODUCTION_CORRECT_REQUIRED &&
    uniqueTypes >= PRODUCTION_TYPES_REQUIRED
  return {
    srsReady,
    correctNonGapFill: Math.min(correctNonGapFill, PRODUCTION_CORRECT_REQUIRED),
    uniqueTypes: Math.min(uniqueTypes, PRODUCTION_TYPES_REQUIRED),
    productionReady,
    mastered: srsReady && productionReady,
  }
}

/**
 * Simple mastery state check. When `productionMastered` is provided, requires
 * both SRS + production gates. When omitted, falls back to SRS-only.
 */
export function getMasteryState(
  intervalDays: number | undefined,
  productionMastered?: boolean,
): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERY_THRESHOLD) {
    if (productionMastered === undefined || productionMastered) return 'mastered'
    return 'learning'
  }
  return 'learning'
}

/**
 * Mastery badge config — adaptive tokens for dark mode support.
 * Uses CSS custom properties from globals.css so colours swap automatically.
 */
/**
 * Mastery dot config — compact 7px circle for curriculum concept rows.
 * Two visual states: filled terracotta (mastered) vs muted outline (learning/new).
 */
export const MASTERY_DOT: Record<MasteryState, { title: string; style: React.CSSProperties }> = {
  mastered: {
    title: 'Dominado',
    style: {
      width: 7,
      height: 7,
      borderRadius: 9999,
      background: 'var(--d5-terracotta)',
      flexShrink: 0,
    },
  },
  learning: {
    title: 'Aprendiendo',
    style: {
      width: 7,
      height: 7,
      borderRadius: 9999,
      background: 'transparent',
      border: '1.5px solid var(--d5-muted)',
      flexShrink: 0,
    },
  },
  new: {
    title: 'Nuevo',
    style: {
      width: 7,
      height: 7,
      borderRadius: 9999,
      background: 'transparent',
      border: '1.5px solid var(--d5-muted)',
      flexShrink: 0,
    },
  },
}

export const MASTERY_BADGE: Record<MasteryState, { label: string; style: React.CSSProperties }> = {
  mastered: {
    label: 'Dominado',
    style: {
      background: 'rgba(196,82,46,0.1)',
      color: 'var(--d5-terracotta)',
      border: '1px solid rgba(196,82,46,0.2)',
      padding: '2px 7px',
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 600,
    },
  },
  learning: {
    label: 'Aprendiendo',
    style: {
      background: 'rgba(59,130,246,0.08)',
      color: 'rgb(59,130,246)',
      border: '1px solid rgba(59,130,246,0.2)',
      padding: '2px 7px',
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 600,
    },
  },
  new: {
    label: 'Nuevo',
    style: {
      background: 'transparent',
      color: 'var(--d5-pill-text-soft)',
      border: '1px solid var(--d5-border-subtle)',
      padding: '2px 7px',
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 600,
    },
  },
}
