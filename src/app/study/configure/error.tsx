'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { isOnline } from '@/lib/platform/network'

export default function StudyConfigureError({
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

  if (!isOffline) {
    return (
      <main className="max-w-md mx-auto px-5 pt-16 text-center space-y-4 animate-page-in">
        <h2 className="senda-heading text-xl">Algo salió mal</h2>
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error inesperado.</p>
        <button onClick={reset} className="senda-cta-outline">Reintentar</button>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-5 pt-5 pb-24 animate-page-in">
      <OfflineIndicator />

      <h1 className="senda-heading text-xl mb-4">Estudio Offline</h1>

      <div className="space-y-3">
        <Link href="/study" className="senda-cta w-full block text-center">
          Estudiar Módulos Descargados
        </Link>
        <Link href="/verbs/configure" className="senda-cta-outline w-full block text-center">
          Practicar Verbos
        </Link>
        <Link href="/dashboard" className="block text-center text-sm mt-4" style={{ color: 'var(--d5-warm)' }}>
          ← Inicio
        </Link>
      </div>
    </main>
  )
}
