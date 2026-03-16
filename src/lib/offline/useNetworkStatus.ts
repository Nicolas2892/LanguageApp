'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Detects online/offline status.
 * Combines navigator.onLine + 'online'/'offline' window events.
 * 1s debounce to avoid flicker on unstable connections.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSet = useCallback((value: boolean) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsOnline(value), 1000)
  }, [])

  useEffect(() => {
    const handleOnline = () => debouncedSet(true)
    const handleOffline = () => {
      // Go offline immediately (no debounce) for responsiveness
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [debouncedSet])

  return { isOnline }
}
