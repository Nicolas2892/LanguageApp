'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Algo salió mal</h2>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>Ha ocurrido un error inesperado.</p>
          <button
            onClick={reset}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px', border: '1px solid #ccc', cursor: 'pointer', background: 'white' }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
