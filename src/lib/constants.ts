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

/** Colour config for CEFR level chips (B1/B2/C1) — unified Warm Yellow per master spec */
export const LEVEL_CHIP: Record<string, { label: string; className: string }> = {
  B1: { label: 'B1', className: 'bg-[#fef9c3] text-[#1A1108] dark:bg-[#fef9c3] dark:text-[#1A1108]' },
  B2: { label: 'B2', className: 'bg-[#fef9c3] text-[#1A1108] dark:bg-[#fef9c3] dark:text-[#1A1108]' },
  C1: { label: 'C1', className: 'bg-[#fef9c3] text-[#1A1108] dark:bg-[#fef9c3] dark:text-[#1A1108]' },
}
