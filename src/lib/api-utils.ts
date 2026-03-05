/**
 * Shared helpers used by /api/submit and /api/grade to avoid duplicated logic.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeLevel } from '@/lib/mastery/computeLevel'

/**
 * Updates the user's streak using the atomic Postgres RPC
 * `increment_streak_if_new_day`. Falls back to a no-op if the RPC is not yet
 * deployed (e.g. in test environments).
 */
export async function updateStreakIfNeeded(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<void> {
  await supabase.rpc('increment_streak_if_new_day', { p_user_id: userId })
}

/**
 * Recomputes the user's CEFR level from their concept mastery and persists it
 * to `profiles.computed_level`.
 */
export async function updateComputedLevel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
): Promise<void> {
  const { data: levelRows } = await supabase
    .from('concepts')
    .select('level, user_progress!inner(production_mastered, interval_days)')
    .eq('user_progress.user_id', userId)

  type LevelRow = {
    level: string
    user_progress: { production_mastered: boolean; interval_days: number }[]
  }

  const totalByLevel: Record<string, number> = {}
  const masteredByLevel: Record<string, number> = {}

  for (const row of ((levelRows ?? []) as LevelRow[])) {
    totalByLevel[row.level] = (totalByLevel[row.level] ?? 0) + 1
    const progress = row.user_progress[0]
    if (progress?.interval_days >= 21 && progress?.production_mastered) {
      masteredByLevel[row.level] = (masteredByLevel[row.level] ?? 0) + 1
    }
  }

  const newComputedLevel = computeLevel(masteredByLevel, totalByLevel)
  await supabase
    .from('profiles')
    .update({ computed_level: newComputedLevel })
    .eq('id', userId)
}
