'use client'

import { useEffect, type ReactNode } from 'react'
import { initAnalytics, identifyUser } from '@/lib/analytics'

interface Props {
  children: ReactNode
  userId?: string
}

export function PostHogProvider({ children, userId }: Props) {
  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (userId) {
      identifyUser(userId)
    }
  }, [userId])

  return <>{children}</>
}
