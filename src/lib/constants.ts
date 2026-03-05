/** Max number of concepts fetched in a default SRS review session */
export const SESSION_SIZE = 10

/** Number of easiest concepts bootstrapped for brand-new users */
export const BOOTSTRAP_SIZE = 5

/** interval_days threshold above which a concept is considered mastered */
export const MASTERY_THRESHOLD = 21

/** Colour config for CEFR level chips (B1/B2/C1) */
export const LEVEL_CHIP: Record<string, { label: string; className: string }> = {
  B1: { label: 'B1', className: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  B2: { label: 'B2', className: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  C1: { label: 'C1', className: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
}
