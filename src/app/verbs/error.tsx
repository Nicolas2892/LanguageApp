'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { useOfflineVerbs } from '@/lib/offline/hooks'
import { isOnline } from '@/lib/platform/network'

export default function VerbsError({
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
  const { data, loading } = useOfflineVerbs()

  if (!isOffline) {
    return (
      <main className="max-w-3xl mx-auto px-5 pt-16 text-center space-y-4 animate-page-in">
        <h2 className="senda-heading text-xl">Algo salió mal</h2>
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>Ha ocurrido un error inesperado.</p>
        <button onClick={reset} className="senda-cta-outline">Reintentar</button>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6 animate-page-in">
        <div className="senda-skeleton-fill animate-senda-pulse h-6 w-32 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="senda-skeleton-fill animate-senda-pulse h-20 rounded-xl" />
          ))}
        </div>
      </main>
    )
  }

  const verbs = data?.verbs ?? []
  const favoriteSet = new Set((data?.favorites ?? []).map((f) => f.verb_id))
  const progressByVerb = new Map<string, Map<string, { attempts: number; correct: number }>>()

  for (const p of (data?.progress ?? [])) {
    if (!progressByVerb.has(p.verb_id)) progressByVerb.set(p.verb_id, new Map())
    progressByVerb.get(p.verb_id)!.set(p.tense, {
      attempts: p.attempt_count,
      correct: p.correct_count,
    })
  }

  const sortedVerbs = [...verbs].sort((a, b) => a.infinitive.localeCompare(b.infinitive))

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10 animate-page-in">
      <OfflineIndicator />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="senda-heading text-2xl">Verbos</h1>
          <p className="senda-eyebrow mt-2">{verbs.length} verbos de alta frecuencia</p>
        </div>
        <Link
          href="/verbs/configure"
          className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Practica →
        </Link>
      </div>

      {sortedVerbs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
          Los verbos se cargarán automáticamente cuando tengas conexión.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sortedVerbs.map((v) => {
            const tenseProgress = progressByVerb.get(v.id)
            const hasPractice = tenseProgress && tenseProgress.size > 0
            return (
              <Link
                key={v.id}
                href={`/verbs/${v.infinitive}`}
                className="senda-card p-3 hover:bg-muted/50 transition-colors"
              >
                <p className="font-semibold text-sm">{v.infinitive}</p>
                <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>{v.english}</p>
                {hasPractice && (
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from(tenseProgress.values()).map((tp, i) => (
                      <span
                        key={i}
                        className="rounded-full"
                        style={{
                          width: 5,
                          height: 5,
                          background:
                            tp.attempts > 0 && Math.round((tp.correct / tp.attempts) * 100) >= 70
                              ? 'var(--d5-terracotta)'
                              : 'var(--d5-muted)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
