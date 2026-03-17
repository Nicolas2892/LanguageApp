'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    // Loop guard — at most 1 reload per tab session
    const RELOAD_KEY = 'sw-reload'
    const handleControllerChange = () => {
      if (sessionStorage.getItem(RELOAD_KEY)) return
      sessionStorage.setItem(RELOAD_KEY, '1')
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Register background sync (Chrome/Edge only — Safari doesn't support it)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(registration as any).sync?.register('sync-offline-attempts').catch(() => {})
      })
      .catch((err) => {
        const sentry = (window as unknown as Record<string, unknown>)['Sentry'] as
          | { captureException?: (e: unknown) => void }
          | undefined
        if (sentry?.captureException) sentry.captureException(err)
      })

    // Clear reload guard on fresh mount (new session)
    if (sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.removeItem(RELOAD_KEY)
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}
