import type { UserProgress } from '@/lib/supabase/types'

export type SRSScore = 0 | 1 | 2 | 3

export interface SRSResult {
  ease_factor: number
  interval_days: number
  due_date: string   // ISO date string YYYY-MM-DD
  repetitions: number
}

/**
 * SM-2 spaced repetition algorithm.
 * Pure function — no side effects.
 *
 * Score meanings (assigned by Claude, never the user):
 *   0 = wrong / concept not applied
 *   1 = partially correct / unnatural
 *   2 = correct with minor errors
 *   3 = correct, natural, confident
 */
export function sm2(progress: Pick<UserProgress, 'ease_factor' | 'interval_days' | 'repetitions'>, score: SRSScore): SRSResult {
  let { ease_factor, interval_days, repetitions } = progress

  if (score >= 2) {
    // Correct response — advance interval
    if (repetitions === 0) {
      interval_days = 1
    } else if (repetitions === 1) {
      interval_days = 6
    } else {
      interval_days = Math.round(interval_days * ease_factor)
    }
    repetitions += 1
    // Update ease factor (EF stays >= 1.3)
    ease_factor = ease_factor + (0.1 - (3 - score) * (0.08 + (3 - score) * 0.02))
    ease_factor = Math.max(1.3, parseFloat(ease_factor.toFixed(2)))
  } else {
    // Incorrect — reset to start
    repetitions = 0
    interval_days = score === 1 ? 3 : 1
  }

  const due = new Date()
  due.setDate(due.getDate() + interval_days)
  const due_date = due.toISOString().split('T')[0]

  return { ease_factor, interval_days, due_date, repetitions }
}

/** Default progress values for a concept being seen for the first time. */
export const DEFAULT_PROGRESS = {
  ease_factor: 2.5,
  interval_days: 1,
  repetitions: 0,
} satisfies Pick<UserProgress, 'ease_factor' | 'interval_days' | 'repetitions'>
