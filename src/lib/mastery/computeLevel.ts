/**
 * Computes the user's CEFR level from mastery statistics.
 *
 * Dual mastery criterion per concept:
 *   1. Memory: user_progress.interval_days >= 21 (long-term SRS retention)
 *   2. Production: at least one attempt with ai_score >= 2 on a Tier 2/3 exercise
 *
 * Level thresholds:
 *   B1 (default): < 70% of B1 concepts dually mastered
 *   B2:           >= 70% of B1 concepts dually mastered
 *   C1:           >= 70% of B1 AND >= 60% of B2 concepts dually mastered
 */

export const PRODUCTION_TYPES = [
  'translation',
  'transformation',
  'sentence_builder',
  'free_write',
] as const

export type ProductionType = (typeof PRODUCTION_TYPES)[number]

/**
 * @param masteredByLevel - count of dually mastered concepts per CEFR level key
 * @param totalByLevel    - total concepts per CEFR level key
 */
export function computeLevel(
  masteredByLevel: Partial<Record<string, number>>,
  totalByLevel: Partial<Record<string, number>>,
): 'B1' | 'B2' | 'C1' {
  const pct = (lvl: string): number => {
    const total = totalByLevel[lvl] ?? 0
    if (total === 0) return 0
    return (masteredByLevel[lvl] ?? 0) / total
  }

  if (pct('B1') >= 0.70 && pct('B2') >= 0.60) return 'C1'
  if (pct('B1') >= 0.70) return 'B2'
  return 'B1'
}
