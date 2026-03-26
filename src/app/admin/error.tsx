'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
      <h2 className="senda-heading text-lg">Algo salió mal</h2>
      <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error en el panel de administración.</p>
      <button onClick={reset} className="senda-cta-outline">Reintentar</button>
    </div>
  )
}
