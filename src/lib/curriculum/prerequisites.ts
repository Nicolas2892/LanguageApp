import type { SupabaseClient } from '@supabase/supabase-js'
import { LEVEL_UNLOCK_THRESHOLD } from '@/lib/constants'

export type CefrLevel = 'B1' | 'B2' | 'C1'
export type UnlockedLevels = Set<CefrLevel>

/**
 * Returns which CEFR levels are unlocked for the automatic study queue.
 * B1 is always unlocked. B2 unlocks when >= LEVEL_UNLOCK_THRESHOLD of B1 concepts
 * have been attempted. C1 unlocks when >= LEVEL_UNLOCK_THRESHOLD of B2 concepts
 * have been attempted.
 *
 * NOTE: This only gates the automatic 'mode=new' queue. Manual practice via
 * ?concept=<id> or ?unit/module always works regardless of unlock state.
 */
export async function computeUnlockedLevels(
  supabase: SupabaseClient,
  userId: string
): Promise<UnlockedLevels> {
  const [conceptsRes, progressRes] = await Promise.all([
    supabase.from('concepts').select('id, level'),
    supabase.from('user_progress').select('concept_id').eq('user_id', userId),
  ])

  const concepts = (conceptsRes.data ?? []) as { id: string; level: string | null }[]
  const attemptedIds = new Set(
    ((progressRes.data ?? []) as { concept_id: string }[]).map((p) => p.concept_id)
  )

  const b1 = concepts.filter((c) => c.level === 'B1')
  const b2 = concepts.filter((c) => c.level === 'B2')

  const b1Fraction = b1.length === 0 ? 1 : b1.filter((c) => attemptedIds.has(c.id)).length / b1.length
  const b2Fraction = b2.length === 0 ? 1 : b2.filter((c) => attemptedIds.has(c.id)).length / b2.length

  const unlocked: UnlockedLevels = new Set(['B1'])
  if (b1Fraction >= LEVEL_UNLOCK_THRESHOLD) unlocked.add('B2')
  if (unlocked.has('B2') && b2Fraction >= LEVEL_UNLOCK_THRESHOLD) unlocked.add('C1')
  return unlocked
}

/** Returns progress toward unlocking the next level, for the curriculum page banner. */
export function computeUnlockProgress(
  concepts: { id: string; level: string | null }[],
  attemptedIds: Set<string>
): { nextLevel: CefrLevel | null; attempted: number; total: number; threshold: number } {
  const b1 = concepts.filter((c) => c.level === 'B1')
  const b2 = concepts.filter((c) => c.level === 'B2')

  const b1Attempted = b1.filter((c) => attemptedIds.has(c.id)).length
  const b2Attempted = b2.filter((c) => attemptedIds.has(c.id)).length

  const b1Threshold = Math.ceil(b1.length * LEVEL_UNLOCK_THRESHOLD)
  const b2Threshold = Math.ceil(b2.length * LEVEL_UNLOCK_THRESHOLD)

  if (b1Attempted < b1Threshold) {
    return { nextLevel: 'B2', attempted: b1Attempted, total: b1.length, threshold: b1Threshold }
  }
  if (b2Attempted < b2Threshold) {
    return { nextLevel: 'C1', attempted: b2Attempted, total: b2.length, threshold: b2Threshold }
  }
  return { nextLevel: null, attempted: 0, total: 0, threshold: 0 }
}
