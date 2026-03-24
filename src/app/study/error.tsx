'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { WifiOff } from 'lucide-react'
import { isOnline } from '@/lib/platform/network'

export default function StudyError({
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
            Puedes estudiar módulos descargados o practicar verbos sin conexión.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/study/configure" className="senda-cta-outline">Configurar Sesión</Link>
            <Link href="/verbs/configure" className="senda-cta-outline">Practicar Verbos</Link>
          </div>
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
