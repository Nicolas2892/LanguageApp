'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { isOnline as checkOnline, onStatusChange } from '@/lib/platform/network'

/**
 * Detects online/offline status.
 * Combines navigator.onLine + 'online'/'offline' window events.
 * 1s debounce to avoid flicker on unstable connections.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => checkOnline())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSet = useCallback((value: boolean) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsOnline(value), 1000)
  }, [])

  useEffect(() => {
    const cleanup = onStatusChange((online) => {
      if (online) {
        debouncedSet(true)
      } else {
        // Go offline immediately (no debounce) for responsiveness
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsOnline(false)
      }
    })

    return () => {
      cleanup()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [debouncedSet])

  return { isOnline }
}
