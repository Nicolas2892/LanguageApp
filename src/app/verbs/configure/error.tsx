'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { ROUTES } from '@/lib/routes'
import { isOnline } from '@/lib/platform/network'
import { WifiOff } from 'lucide-react'

export default function VerbConfigureError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isOffline = !isOnline()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
      {isOffline ? (
        <>
          <WifiOff size={32} strokeWidth={1.5} className="mx-auto" style={{ color: 'var(--d5-muted)' }} />
          <h2 className="senda-heading text-lg">Sin conexión</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
            No se pudo cargar la configuración de verbos sin conexión.
          </p>
          <Link href={ROUTES.verbs} className="senda-cta-outline">Volver a Verbos</Link>
        </>
      ) : (
        <>
          <h2 className="senda-heading text-lg">Algo salió mal</h2>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error inesperado.</p>
          <div className="flex flex-col gap-2 pt-2">
            <button onClick={reset} className="senda-cta-outline">Reintentar</button>
            <Link href={ROUTES.verbs} className="senda-cta-outline">Volver a Verbos</Link>
          </div>
        </>
      )}
    </div>
  )
}
