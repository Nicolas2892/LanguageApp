import { MASTERY_THRESHOLD } from '../constants'

export type MasteryState = 'mastered' | 'learning' | 'new'

export function getMasteryState(intervalDays: number | undefined): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERY_THRESHOLD) return 'mastered'
  return 'learning'
}

/**
 * Mastery badge config — adaptive tokens for dark mode support.
 * Uses CSS custom properties from globals.css so colours swap automatically.
 */
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
