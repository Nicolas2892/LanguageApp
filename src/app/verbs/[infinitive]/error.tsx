'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { useOfflineVerbDetail } from '@/lib/offline/hooks'
import { TENSES, TENSE_LABELS } from '@/lib/verbs/constants'
import { isOnline } from '@/lib/platform/network'

const PRONOUNS = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'] as const
const PRONOUN_KEYS = ['yo', 'tu', 'el', 'nosotros', 'vosotros', 'ellos'] as const

export default function VerbDetailError({
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

  // Extract infinitive from pathname
  const infinitive = typeof window !== 'undefined'
    ? decodeURIComponent(window.location.pathname.split('/verbs/')[1] ?? '')
    : ''

  const { data, loading } = useOfflineVerbDetail(infinitive)

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
      <main className="max-w-2xl mx-auto px-5 pt-5 pb-24 animate-page-in">
        <div className="senda-skeleton-fill animate-senda-pulse h-8 w-40 rounded mb-4" />
        <div className="senda-skeleton-fill animate-senda-pulse h-48 rounded-xl" />
      </main>
    )
  }

  const verb = data?.verb
  const conjugations = data?.conjugations ?? []
  const progress = data?.progress ?? []
  const progressMap = new Map(progress.map((p) => [p.tense, p]))

  if (!verb) {
    return (
      <main className="max-w-2xl mx-auto px-5 pt-16 text-center space-y-4 animate-page-in">
        <OfflineIndicator />
        <h2 className="senda-heading text-xl">Verbo no encontrado</h2>
        <Link href="/verbs" className="senda-cta-outline">← Volver a Léxico</Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10 animate-page-in">
      <OfflineIndicator />

      <div>
        <Link href="/verbs" className="text-[11px] font-semibold" style={{ color: 'var(--d5-body)' }}>
          ← Léxico
        </Link>
        <h1 className="senda-heading text-2xl mt-1">{verb.infinitive}</h1>
        <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>{verb.english}</p>
      </div>

      {/* Conjugation tables */}
      {TENSES.filter(t => t !== 'infinitive').map((tense) => {
        const conj = conjugations.find((c) => c.tense === tense)
        if (!conj) return null

        const prog = progressMap.get(tense)
        const pct = prog && prog.attempt_count > 0
          ? Math.round((prog.correct_count / prog.attempt_count) * 100)
          : null

        return (
          <div key={tense} className="senda-card space-y-2">
            <div className="flex items-center justify-between">
              <p className="senda-eyebrow">{TENSE_LABELS[tense] ?? tense}</p>
              {pct !== null && (
                <span className="text-xs font-semibold" style={{ color: pct >= 70 ? 'var(--d5-terracotta)' : 'var(--d5-muted)' }}>
                  {pct}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {PRONOUN_KEYS.map((key, i) => (
                <div key={key} className="flex justify-between py-0.5">
                  <span style={{ color: 'var(--d5-muted)' }}>{PRONOUNS[i]}</span>
                  <span className="font-medium">{conj[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <Link
        href={`/verbs/configure?verb=${verb.infinitive}&verbSet=single`}
        className="senda-cta w-full block text-center"
      >
        Practicar {verb.infinitive} →
      </Link>
    </main>
  )
}
