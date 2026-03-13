'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          const sentry = (window as unknown as Record<string, unknown>)['Sentry'] as
            | { captureException?: (e: unknown) => void }
            | undefined
          if (sentry?.captureException) sentry.captureException(err)
        })
    }
  }, [])

  return null
}
