'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { useOfflineProgress } from '@/lib/offline/hooks'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { AnimatedBar } from '@/components/AnimatedBar'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'

const CEFR_COLORS: Record<string, { barStyle: React.CSSProperties }> = {
  B1: { barStyle: { background: 'var(--d5-muted)' } },
  B2: { barStyle: { background: 'var(--d5-terracotta)' } },
  C1: { barStyle: { background: 'var(--d5-warm)' } },
}

export default function ProgressError({
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
  const { data, loading } = useOfflineProgress()

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
      <main className="max-w-2xl mx-auto p-6 animate-page-in">
        <div className="senda-skeleton-fill animate-senda-pulse h-6 w-40 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="senda-skeleton-fill animate-senda-pulse h-16 rounded-xl" />
          ))}
        </div>
      </main>
    )
  }

  const profile = data?.profile
  const concepts = data?.concepts ?? []
  const progress = data?.progress ?? []
  const verbProgress = data?.verbProgress ?? []

  const currentStreak = profile?.streak ?? 0
  const computedLevel = profile?.computed_level ?? 'B1'

  // CEFR breakdown
  const totalByLevel = new Map<string, number>()
  const conceptLevelMap = new Map<string, string>()
  for (const c of concepts) {
    if (c.level) {
      totalByLevel.set(c.level, (totalByLevel.get(c.level) ?? 0) + 1)
      conceptLevelMap.set(c.id, c.level)
    }
  }

  const masteredByLevel = new Map<string, number>()
  let totalMastered = 0
  for (const p of progress) {
    const level = conceptLevelMap.get(p.concept_id)
    if (!level) continue
    if (p.interval_days >= MASTERY_THRESHOLD && p.production_mastered) {
      masteredByLevel.set(level, (masteredByLevel.get(level) ?? 0) + 1)
      totalMastered++
    }
  }

  const cefrData = (['B1', 'B2', 'C1'] as const).map((level) => ({
    level,
    mastered: masteredByLevel.get(level) ?? 0,
    total: totalByLevel.get(level) ?? 0,
  }))

  // Verb tense mastery
  const verbTenseMap = new Map<string, { correct: number; attempts: number }>()
  for (const p of verbProgress) {
    const entry = verbTenseMap.get(p.tense) ?? { correct: 0, attempts: 0 }
    entry.attempts += p.attempt_count
    entry.correct += p.correct_count
    verbTenseMap.set(p.tense, entry)
  }

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-8 pb-24 lg:pb-10 animate-page-in">
      <OfflineIndicator cachedAt={profile?.cached_at} />

      <div>
        <h1 className="senda-heading text-2xl">Tu Progreso</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--d5-warm)' }}>
          Nivel {computedLevel}
        </p>
      </div>

      <WindingPathSeparator />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="senda-card-sm text-center">
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--d5-terracotta)', lineHeight: 1.2 }}>{currentStreak}</p>
          <p style={{ fontSize: 9, color: 'var(--d5-muted)', marginTop: 2 }}>días seguidos</p>
        </div>
        <div className="senda-card-sm text-center">
          <p className="text-foreground" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{totalMastered}</p>
          <p style={{ fontSize: 9, color: 'var(--d5-muted)', marginTop: 2 }}>
            de {concepts.length} dominados
          </p>
        </div>
      </div>

      <WindingPathSeparator />

      {/* CEFR bars */}
      <section className="space-y-4 px-1">
        <p className="senda-eyebrow" style={{ color: 'var(--d5-muted)' }}>Tu Camino CEFR</p>
        <div className="space-y-5">
          {cefrData.map(({ level, mastered, total }) => {
            const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
            const color = CEFR_COLORS[level]
            return (
              <div key={level} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{level}</span>
                  <span className="text-muted-foreground">{mastered} / {total} dominados</span>
                </div>
                <div className="relative h-1 w-full rounded-full overflow-hidden" style={{ background: 'color-mix(in oklch, var(--d5-muted) 20%, transparent)' }}>
                  <AnimatedBar pct={pct} style={color?.barStyle} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {verbTenseMap.size > 0 && (
        <>
          <WindingPathSeparator />
          <section className="space-y-3">
            <p className="senda-eyebrow" style={{ color: 'var(--d5-muted)' }}>Verbos por Tiempo</p>
            <p className="text-xs" style={{ color: 'var(--d5-warm)' }}>
              Actividad semanal no disponible offline.
            </p>
          </section>
        </>
      )}
    </main>
  )
}
