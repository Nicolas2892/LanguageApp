'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { useOfflineCurriculum } from '@/lib/offline/hooks'
import { getMasteryState, MASTERY_DOT } from '@/lib/mastery/badge'
import type { MasteryState } from '@/lib/mastery/badge'

export default function CurriculumError({
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
  const { data, loading } = useOfflineCurriculum()

  if (!isOffline) {
    return (
      <main className="max-w-2xl mx-auto px-5 pt-16 text-center space-y-4 animate-page-in">
        <h2 className="senda-heading text-xl">Algo salió mal</h2>
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error inesperado.</p>
        <button onClick={reset} className="senda-cta-outline">Reintentar</button>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-5 pt-5 pb-24 animate-page-in">
        <div className="senda-skeleton-fill animate-senda-pulse h-6 w-40 rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="senda-skeleton-fill animate-senda-pulse h-16 rounded-xl mb-3" />
        ))}
      </main>
    )
  }

  const modules = data?.modules ?? []
  const concepts = data?.concepts ?? []
  const progress = data?.progress ?? []

  // Build progress map
  const progressMap = new Map(progress.map((p) => [p.concept_id, p]))

  // Group concepts by module_id → unit_id
  const conceptsByModule = new Map<string, typeof concepts>()
  for (const c of concepts) {
    const existing = conceptsByModule.get(c.module_id) ?? []
    existing.push(c)
    conceptsByModule.set(c.module_id, existing)
  }

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-4 pb-24 lg:pb-10 animate-page-in">
      <OfflineIndicator />
      <h1 className="senda-heading text-2xl">Currículo</h1>

      {modules.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
          Visita esta página cuando tengas conexión para cargar el currículo.
        </p>
      ) : (
        modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((mod) => {
            const moduleConcepts = conceptsByModule.get(mod.id) ?? []
            return (
              <div key={mod.id} className="senda-card space-y-2">
                <p className="senda-eyebrow">{mod.title}</p>
                <div className="space-y-1">
                  {moduleConcepts.map((c) => {
                    const p = progressMap.get(c.id)
                    const state: MasteryState = p
                      ? getMasteryState(p.interval_days, p.production_mastered)
                      : 'new'
                    const dot = MASTERY_DOT[state]
                    return (
                      <Link
                        key={c.id}
                        href={`/study?practice=true&concept=${c.id}`}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span
                          className="shrink-0"
                          style={dot?.style ?? { width: 7, height: 7, borderRadius: 9999, background: 'var(--d5-muted)' }}
                        />
                        <span className="text-sm">{c.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })
      )}
    </main>
  )
}
