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
  if (summaries.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-bold text-base">Verb Conjugation Mastery</h2>
      <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
        {summaries.map(({ tense, correct, attempts, pct }) => {
          const label = TENSE_LABELS[tense as VerbTense] ?? tense
          const barColor =
            pct >= 70 ? 'bg-green-500'
            : pct >= 40 ? 'bg-amber-400'
            : 'bg-rose-400'

          return (
            <div key={tense} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground text-xs">
                  {correct}/{attempts} · {pct}%
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <AnimatedBar pct={pct} className={barColor} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
