/**
 * Shared helpers used by /api/submit and /api/grade to avoid duplicated logic.
 */

/**
 * Validates the Origin header to prevent CSRF attacks.
 * Returns false if the header is missing or doesn't match the deployment origin.
 * Env vars are read at call time so tests can override process.env safely.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  if (process.env.NODE_ENV !== 'production' && origin === 'http://localhost:3000') {
    return true
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    console.warn('[validateOrigin] NEXT_PUBLIC_SITE_URL not set — skipping origin check')
    return true
  }
  return origin === siteUrl
}
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
  const { error } = await supabase.rpc('increment_streak_if_new_day', { p_user_id: userId })
  if (error) {
    console.error('[updateStreakIfNeeded] RPC error:', error.message)
  }
}

/**
 * Recomputes the user's CEFR level from their concept mastery and persists it
 * to `profiles.computed_level`.
 */
export async function updateComputedLevel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  opts?: { justMastered?: boolean },
): Promise<void> {
  if (!opts?.justMastered) return // level can only change on mastery events
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
