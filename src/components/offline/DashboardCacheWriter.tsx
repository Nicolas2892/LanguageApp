'use client'

import { useEffect } from 'react'
import { putDashboardCache } from '@/lib/offline/db'
import type { CachedDashboardStats } from '@/lib/offline/types'

interface Props {
  dueCount: number
  studiedCount: number
  totalConcepts: number
}

/**
 * Silent component that writes dashboard stats to IDB on mount.
 * Enables dashboard error.tsx to show cached stats when offline.
 */
export function DashboardCacheWriter({ dueCount, studiedCount, totalConcepts }: Props) {
  useEffect(() => {
    const stats: CachedDashboardStats = {
      key: 'current',
      due_count: dueCount,
      studied_count: studiedCount,
      total_concepts: totalConcepts,
      cached_at: new Date().toISOString(),
    }
    putDashboardCache(stats).catch(() => {})
  }, [dueCount, studiedCount, totalConcepts])

  return null
}
