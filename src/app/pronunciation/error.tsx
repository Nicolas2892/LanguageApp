'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { isOnline } from '@/lib/platform/network'
import * as Sentry from '@sentry/nextjs'

export default function PronunciationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  const offline = !isOnline()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4 animate-page-in">
      {offline ? (
        <>
          <h2 className="senda-heading text-lg">Sin Conexión</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
            La pronunciación requiere conexión a internet para el análisis de audio.
          </p>
          <Link href={ROUTES.dashboard} className="senda-cta-outline">Volver al Inicio</Link>
        </>
      ) : (
        <>
          <h2 className="senda-heading text-lg">Algo Salió Mal</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error inesperado.</p>
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={reset} className="senda-cta-outline">Reintentar</button>
            <Link href={ROUTES.dashboard} className="senda-cta-outline">Volver al Inicio</Link>
          </div>
        </>
      )}
    </div>
  )
}
