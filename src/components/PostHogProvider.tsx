'use client'

import { useEffect, type ReactNode } from 'react'
import { initAnalytics, identifyUser } from '@/lib/analytics'
import type { UserTraits } from '@/lib/analytics'

interface Props {
  children: ReactNode
  userId?: string
  computedLevel?: string | null
  streak?: number
  timezone?: string | null
  streakFreezeRemaining?: number
  masteredCount?: number
  daysSinceSignup?: number
}

export function PostHogProvider({
  children,
  userId,
  computedLevel,
  streak,
  timezone,
  streakFreezeRemaining,
  masteredCount,
  daysSinceSignup,
}: Props) {
  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (userId) {
      const traits: UserTraits = {
        computed_level: computedLevel,
        streak,
        timezone,
        streak_freeze_remaining: streakFreezeRemaining,
        mastered_count: masteredCount,
        days_since_signup: daysSinceSignup,
      }
      identifyUser(userId, traits)
    }
  }, [userId, computedLevel, streak, timezone, streakFreezeRemaining, masteredCount, daysSinceSignup])

  return <>{children}</>
}
