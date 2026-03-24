'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { WifiOff } from 'lucide-react'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { isOnline } from '@/lib/platform/network'

export default function TutorError({
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
    <div className="flex flex-col h-[100dvh] pb-[calc(3.125rem+env(safe-area-inset-bottom))] lg:pb-0">
      <header
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--d5-line)' }}
      >
        <SvgSendaPath size={24} />
        <div>
          <p className="senda-eyebrow">Tu Tutor de Español</p>
          <h1 className="senda-heading text-xl">Tutor IA</h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          {isOffline ? (
            <>
              <WifiOff size={32} strokeWidth={1.5} className="mx-auto" style={{ color: 'var(--d5-muted)' }} />
              <h2 className="senda-heading text-lg">El tutor necesita conexión a internet</h2>
              <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
                Mientras tanto, puedes practicar verbos o repasar módulos descargados.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/verbs/configure" className="senda-cta-outline">
                  Practicar Verbos
                </Link>
                <Link href="/dashboard" className="text-sm" style={{ color: 'var(--d5-warm)' }}>
                  ← Inicio
                </Link>
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
      </div>
    </div>
  )
}
