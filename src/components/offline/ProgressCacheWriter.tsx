'use client'

import { useEffect } from 'react'
import { putCachedProfile } from '@/lib/offline/db'
import type { CachedProfile } from '@/lib/offline/types'

interface Props {
  streak: number
  computedLevel: string
  timezone: string | null
}

/**
 * Silent component that writes progress-relevant profile data to IDB on mount.
 * The curriculum cache writer handles concepts + progress snapshot.
 */
export function ProgressCacheWriter({ streak, computedLevel, timezone }: Props) {
  useEffect(() => {
    const profile: CachedProfile = {
      key: 'current',
      display_name: null,
      streak,
      streak_freeze_remaining: 0,
      computed_level: computedLevel,
      timezone,
      cached_at: new Date().toISOString(),
    }
    putCachedProfile(profile).catch(() => {})
  }, [streak, computedLevel, timezone])

  return null
}
