'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mic, Headphones } from 'lucide-react'
import { PRONUNCIATION_CATEGORIES, PRONUNCIATION_CATEGORY_LABELS } from '@/lib/pronunciation/l1-maps'
import type { PronunciationCategory } from '@/lib/pronunciation/l1-maps'

type Mode = 'read' | 'shadow'

interface ProgressItem {
  category: string
  attempt_count: number
  correct_count: number
}

interface Props {
  progress: ProgressItem[]
}

export function PronunciationHub({ progress }: Props) {
  const [mode, setMode] = useState<Mode>('read')
  const progressMap = new Map(progress.map((p) => [p.category, p]))

  const categories = [...PRONUNCIATION_CATEGORIES]
    .map((cat) => {
      const p = progressMap.get(cat)
      const accuracy = p && p.attempt_count > 0
        ? Math.round((p.correct_count / p.attempt_count) * 100)
        : null
      return { category: cat, accuracy, attempts: p?.attempt_count ?? 0 }
    })
    .sort((a, b) => {
      if (a.accuracy !== null && b.accuracy !== null) return a.accuracy - b.accuracy
      if (a.accuracy !== null) return -1
      if (b.accuracy !== null) return 1
      return 0
    })

  const totalAttempts = progress.reduce((s, p) => s + p.attempt_count, 0)

  const sessionHref = mode === 'shadow'
    ? '/pronunciation/session?mode=shadow'
    : '/pronunciation/session'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="senda-heading text-2xl">Pronunciación</h1>
        <p className="senda-eyebrow mt-2">
          {totalAttempts > 0
            ? `${totalAttempts} intentos registrados`
            : 'Mejora tu acento leyendo frases en voz alta'}
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex rounded-full p-1 mx-auto w-fit"
        style={{ background: 'var(--d5-pill-bg)' }}
      >
        <button
          onClick={() => setMode('read')}
          className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
          style={{
            background: mode === 'read' ? 'var(--d5-terracotta)' : 'transparent',
            color: mode === 'read' ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
          }}
        >
          Lee la Frase
        </button>
        <button
          onClick={() => setMode('shadow')}
          className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all"
          style={{
            background: mode === 'shadow' ? 'var(--d5-terracotta)' : 'transparent',
            color: mode === 'shadow' ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
          }}
        >
          Sombra
        </button>
      </div>

      {/* Mode description */}
      <p className="text-xs text-center" style={{ color: 'var(--d5-muted)' }}>
        {mode === 'read'
          ? 'Lee la frase en voz alta y recibe puntuación detallada.'
          : 'Escucha primero al nativo, luego repite imitando su entonación.'}
      </p>

      {/* Category progress */}
      <div className="space-y-3">
        {categories.map(({ category, accuracy, attempts }) => (
          <div key={category} className="senda-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--d5-ink)' }}>
                {PRONUNCIATION_CATEGORY_LABELS[category as PronunciationCategory] ?? category}
              </span>
              {accuracy !== null && (
                <span className="text-xs font-bold" style={{ color: 'var(--d5-terracotta)' }}>
                  {accuracy}%
                </span>
              )}
            </div>
            {accuracy !== null ? (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(accuracy, 100)}%` }}
                />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
                Sin intentos · {attempts === 0 ? 'Comienza a practicar' : `${attempts} intentos`}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={sessionHref}
        className="flex items-center justify-center gap-2 w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        {mode === 'shadow' ? <Headphones size={16} /> : <Mic size={16} />}
        {mode === 'shadow' ? 'Practicar Sombra →' : 'Practicar Pronunciación →'}
      </Link>
    </div>
  )
}
