import Link from 'next/link'
import { AnimatedBar } from '@/components/AnimatedBar'
import { ROUTES } from '@/lib/routes'
import { PRONUNCIATION_CATEGORY_LABELS } from '@/lib/pronunciation/l1-maps'
import type { PronunciationCategory } from '@/lib/pronunciation/l1-maps'

export interface PronunciationCategorySummary {
  category: string
  correct: number
  attempts: number
  pct: number
}

interface Props {
  summaries: PronunciationCategorySummary[]
}

export function PronunciationCategoryMastery({ summaries }: Props) {
  if (summaries.length === 0) return null

  return (
    <section className="space-y-4 px-1">
      <p className="senda-eyebrow" style={{ color: 'var(--d5-subtle)' }}>Pronunciación por Categoría</p>
      <div className="space-y-4">
        {summaries.map(({ category, attempts, pct }) => {
          const label = PRONUNCIATION_CATEGORY_LABELS[category as PronunciationCategory] ?? category
          const barColor = pct >= 70 ? 'var(--d5-subtle)' : 'var(--d5-terracotta)'

          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span style={{ fontWeight: 600 }}>{pct}%</span>
              </div>
              <div
                className="relative h-[3px] w-full rounded-full overflow-hidden"
                style={{ background: 'color-mix(in oklch, var(--d5-subtle) 50%, transparent)' }}
              >
                <AnimatedBar pct={pct} style={{ background: barColor }} />
              </div>
              <p style={{ fontSize: '0.5625rem', color: 'var(--d5-subtle)' }}>
                {attempts} intentos
              </p>
            </div>
          )
        })}
      </div>

      <Link
        href={ROUTES.pronunciation}
        className="block text-center text-xs font-semibold text-primary hover:underline pt-1"
      >
        Practicar Pronunciación →
      </Link>
    </section>
  )
}
