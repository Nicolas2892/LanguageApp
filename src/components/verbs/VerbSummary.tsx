import Link from 'next/link'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import type { VerbTense } from '@/lib/verbs/constants'

interface TenseStat {
  tense: string
  correct: number
  total: number
}

interface Props {
  correct: number
  total: number
  tenseStats: TenseStat[]
  onPracticeAgain: () => void
}

export function VerbSummary({ correct, total, tenseStats, onPracticeAgain }: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  // Sort tense stats worst first
  const sorted = [...tenseStats]
    .filter((s) => s.total > 0)
    .sort((a, b) => {
      const pctA = a.total > 0 ? a.correct / a.total : 1
      const pctB = b.total > 0 ? b.correct / b.total : 1
      return pctA - pctB
    })

  const scoreColor =
    pct >= 80 ? 'text-green-600 dark:text-green-400'
    : pct >= 50 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400'

  return (
    <main className="max-w-lg mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
      {/* Score */}
      <div className="text-center space-y-1 py-4">
        <p className={`text-6xl font-extrabold ${scoreColor}`}>{pct}%</p>
        <p className="text-sm text-muted-foreground">
          {correct} correct out of {total}
        </p>
      </div>

      {/* Per-tense breakdown */}
      {sorted.length > 0 && (
        <section className="bg-card rounded-xl border p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">By tense</p>
          <div className="space-y-2">
            {sorted.map((s) => {
              const tensePct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
              const label = TENSE_LABELS[s.tense as VerbTense] ?? s.tense
              return (
                <div key={s.tense} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className={`font-semibold ${
                      tensePct >= 80
                        ? 'text-green-600 dark:text-green-400'
                        : tensePct >= 50
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {s.correct}/{s.total}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onPracticeAgain}
          className="w-full rounded-xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Practice Again
        </button>
        <Link
          href="/verbs"
          className="w-full rounded-xl border border-border py-3.5 text-sm font-medium text-center hover:bg-muted transition-colors"
        >
          Browse Verbs
        </Link>
      </div>
    </main>
  )
}
