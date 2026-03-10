/** Max number of concepts fetched in a default SRS review session */
export const SESSION_SIZE = 10

/** Number of easiest concepts bootstrapped for brand-new users */
export const BOOTSTRAP_SIZE = 5

/** Minimum number of exercises guaranteed in any Open Practice session */
export const MIN_PRACTICE_SIZE = 5

/** interval_days threshold above which a concept is considered mastered */
export const MASTERY_THRESHOLD = 21

/** Fraction of a CEFR level's concepts that must be attempted before the next level unlocks in the automatic queue */
export const LEVEL_UNLOCK_THRESHOLD = 0.8

/** Interval multiplier for hard-flagged concepts (~40% more frequent reviews) */
export const HARD_INTERVAL_MULTIPLIER = 0.6

/** Colour config for CEFR level chips (B1/B2/C1) — D5 subtle palette */
export const LEVEL_CHIP: Record<string, { label: string; className: string }> = {
  B1: { label: 'B1', className: 'bg-green-500/[0.12] text-green-800 dark:bg-green-400/[0.12] dark:text-green-300' },
  B2: { label: 'B2', className: 'bg-amber-500/[0.12] text-amber-800 dark:bg-amber-400/[0.12] dark:text-amber-300' },
  C1: { label: 'C1', className: 'bg-violet-500/[0.12] text-violet-800 dark:bg-violet-400/[0.12] dark:text-violet-300' },
}
