'use client'

import { useEffect } from 'react'
import { putCachedProfile } from '@/lib/offline/db'
import type { CachedProfile } from '@/lib/offline/types'

interface Props {
  displayName: string | null
  streak: number
  streakFreezeRemaining: number
  computedLevel: string | null
  timezone: string | null
}

/**
 * Silent component that writes profile data to IDB on mount.
 * Enables offline shells to display cached user info.
 * Rendered in layout.tsx when userId exists.
 */
export function ProfileCacheWriter({ displayName, streak, streakFreezeRemaining, computedLevel, timezone }: Props) {
  useEffect(() => {
    const profile: CachedProfile = {
      key: 'current',
      display_name: displayName,
      streak,
      streak_freeze_remaining: streakFreezeRemaining,
      computed_level: computedLevel,
      timezone,
      cached_at: new Date().toISOString(),
    }
    putCachedProfile(profile).catch(() => {})
  }, [displayName, streak, streakFreezeRemaining, computedLevel, timezone])

  return null
}
