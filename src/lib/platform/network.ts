/**
 * SSR-safe wrapper for navigator.onLine.
 * Returns true on the server (optimistic default).
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Subscribe to online/offline status changes.
 * Returns a cleanup function that removes the listeners.
 */
export function onStatusChange(callback: (online: boolean) => void): () => void {
  const onOnline = () => callback(true)
  const onOffline = () => callback(false)

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
