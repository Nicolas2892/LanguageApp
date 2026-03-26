'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { WifiOff } from 'lucide-react'
import { isOnline } from '@/lib/platform/network'

export default function OfflineReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const offline = !isOnline()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
      {offline ? (
        <>
          <WifiOff size={32} strokeWidth={1.5} className="mx-auto" style={{ color: 'var(--d5-muted)' }} />
          <h2 className="senda-heading text-lg">Sin conexión</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
            Los informes requieren conexión a internet.
          </p>
          <Link href="/dashboard" className="senda-cta-outline">Volver al inicio</Link>
        </>
      ) : (
        <>
          <h2 className="senda-heading text-lg">Algo salió mal</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>No se pudieron cargar los informes.</p>
          <button onClick={reset} className="senda-cta-outline">Reintentar</button>
        </>
      )}
    </div>
  )
}
