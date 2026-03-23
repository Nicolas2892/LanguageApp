'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { WifiOff } from 'lucide-react'

export default function WriteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
      {isOffline ? (
        <>
          <WifiOff size={32} strokeWidth={1.5} className="mx-auto" style={{ color: 'var(--d5-muted)' }} />
          <h2 className="senda-heading text-lg">La escritura libre necesita conexión</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
            Este ejercicio usa IA para generar el tema y evaluar tu respuesta.
          </p>
          <Link href="/dashboard" className="senda-cta-outline inline-block">← Inicio</Link>
        </>
      ) : (
        <>
          <h2 className="senda-heading text-lg">Algo salió mal</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error inesperado.</p>
          <button onClick={reset} className="senda-cta-outline">Reintentar</button>
        </>
      )}
    </div>
  )
}
