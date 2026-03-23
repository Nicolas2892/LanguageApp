'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Listens for the browser 'online' event and triggers a router refresh
 * so Server Components re-render with fresh data.
 * Shows a brief toast notification.
 */
export function ReconnectRefresher() {
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleOnline() {
      setShowToast(true)
      router.refresh()
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = setTimeout(() => setShowToast(false), 3000)
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [router])

  if (!showToast) return null

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] senda-card flex items-center gap-2 animate-card-in lg:ml-[110px]"
      style={{
        padding: '0.5rem 1rem',
        boxShadow: '0 4px 20px rgba(26,17,8,0.12)',
      }}
    >
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--d5-terracotta)' }} />
      <p className="text-xs font-medium" style={{ color: 'var(--d5-ink)' }}>
        Conexión restaurada
      </p>
    </div>
  )
}
