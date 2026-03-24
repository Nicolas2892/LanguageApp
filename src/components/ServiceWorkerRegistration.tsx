'use client'

import { useEffect, useState, useCallback } from 'react'
import { UpdateToast } from '@/components/UpdateToast'

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null)

  // Explicitly type to avoid shadowing the global ServiceWorkerRegistration type
  type SWRegistration = globalThis.ServiceWorkerRegistration

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    let registration: SWRegistration | null = null

    const onWaiting = (sw: ServiceWorker) => {
      setWaitingSW(sw)
      setUpdateAvailable(true)
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        registration = reg

        // SW already waiting (e.g. page was refreshed after a deploy)
        if (reg.waiting) {
          onWaiting(reg.waiting)
          return
        }

        // Listen for new SW entering "waiting" state
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed but waiting — existing tab has active controller
              onWaiting(installing)
            }
          })
        })

        // Register background sync (Chrome/Edge only — Safari doesn't support it)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(reg as any).sync?.register('sync-offline-attempts').catch(() => {})
      })
      .catch((err) => {
        const sentry = (window as unknown as Record<string, unknown>)['Sentry'] as
          | { captureException?: (e: unknown) => void }
          | undefined
        if (sentry?.captureException) sentry.captureException(err)
      })

    // No cleanup needed — the SW registration outlives the component,
    // and the updatefound/statechange listeners are harmless if the
    // component unmounts (they just set React state on an unmounted component,
    // which React ignores).
  }, [])

  const applyUpdate = useCallback(() => {
    if (!waitingSW) return

    // Listen for the new SW to take control, then reload
    const onControllerChange = () => {
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    // Tell the waiting SW to activate
    waitingSW.postMessage({ type: 'SKIP_WAITING' })
  }, [waitingSW])

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  if (!updateAvailable) return null

  return <UpdateToast onUpdate={applyUpdate} onDismiss={dismissUpdate} />
}
