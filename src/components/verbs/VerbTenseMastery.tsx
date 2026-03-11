import { AnimatedBar } from '@/components/AnimatedBar'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import type { VerbTense } from '@/lib/verbs/constants'

export interface TenseSummary {
  tense: string
  correct: number
  attempts: number
  pct: number
}

interface Props {
  summaries: TenseSummary[]
}

export function VerbTenseMastery({ summaries }: Props) {
  if (summaries.length === 0) {
    return (
      <section className="space-y-3 px-1">
        <p className="senda-eyebrow" style={{ color: 'var(--d5-muted)' }}>Verbos por Tiempo</p>
        <p
          style={{
            fontFamily: 'var(--font-lora), serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--d5-muted)',
          }}
        >
          Completa ejercicios de verbos para ver tu progreso.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4 px-1">
      <p className="senda-eyebrow" style={{ color: 'var(--d5-muted)' }}>Verbos por Tiempo</p>
      <div className="space-y-4">
        {summaries.map(({ tense, attempts, pct }) => {
          const label = TENSE_LABELS[tense as VerbTense] ?? tense
          const barColor = pct >= 70 ? 'var(--d5-muted)' : 'var(--d5-terracotta)'

          return (
            <div key={tense} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span style={{ fontWeight: 600 }}>{pct}%</span>
              </div>
              <div
                className="relative h-[3px] w-full rounded-full overflow-hidden"
                style={{ background: 'color-mix(in oklch, var(--d5-muted) 20%, transparent)' }}
              >
                <AnimatedBar pct={pct} style={{ background: barColor }} />
              </div>
              <p style={{ fontSize: 9, color: 'var(--d5-muted)' }}>
                {attempts} intentos
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
