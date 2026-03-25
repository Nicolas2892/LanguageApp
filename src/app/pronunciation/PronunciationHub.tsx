'use client'

import Link from 'next/link'
import { Mic } from 'lucide-react'
import { PRONUNCIATION_CATEGORIES } from '@/lib/pronunciation/l1-maps'
import type { PronunciationCategory } from '@/lib/pronunciation/l1-maps'

const CATEGORY_LABELS: Record<PronunciationCategory, string> = {
  stress: 'Acentuación',
  fluency: 'Fluidez',
  prosody: 'Prosodia',
  rr: 'R Vibrante (rr)',
  x: 'Jota (J/G)',
  ɲ: 'Eñe (Ñ)',
  vowels: 'Vocales',
  consonants: 'Consonantes',
}

interface ProgressItem {
  category: string
  attempt_count: number
  correct_count: number
}

interface Props {
  progress: ProgressItem[]
}

export function PronunciationHub({ progress }: Props) {
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
      // Practiced items with lowest accuracy first, then unpracticed
      if (a.accuracy !== null && b.accuracy !== null) return a.accuracy - b.accuracy
      if (a.accuracy !== null) return -1
      if (b.accuracy !== null) return 1
      return 0
    })

  const totalAttempts = progress.reduce((s, p) => s + p.attempt_count, 0)

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

      {/* Category progress */}
      <div className="space-y-3">
        {categories.map(({ category, accuracy, attempts }) => (
          <div key={category} className="senda-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--d5-ink)' }}>
                {CATEGORY_LABELS[category as PronunciationCategory] ?? category}
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
        href="/pronunciation/session"
        className="flex items-center justify-center gap-2 w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Mic size={16} />
        Practicar Pronunciación →
      </Link>
    </div>
  )
}
