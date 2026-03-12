'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { PartyPopper, CheckCircle2, XCircle } from 'lucide-react'
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
  const confettiFired = useRef(false)

  useEffect(() => {
    if (pct >= 70 && !confettiFired.current) {
      confettiFired.current = true
      import('canvas-confetti')
        .then(({ default: confetti }) => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
        })
        .catch(() => {})
    }
  }, [pct])
  const missed = total - correct

  // Sort tense stats worst first
  const sorted = [...tenseStats]
    .filter((s) => s.total > 0)
    .sort((a, b) => {
      const pctA = a.total > 0 ? a.correct / a.total : 1
      const pctB = b.total > 0 ? b.correct / b.total : 1
      return pctA - pctB
    })

  const sessionLabel = pct >= 90
    ? 'Impecable.'
    : pct >= 70
    ? 'Buen trabajo — Sigue Practicando.'
    : pct >= 50
    ? 'Las difíciles son las que vale la pena repetir.'
    : 'Sesión difícil — para eso es el repaso.'

  return (
    <div className="space-y-6 text-center py-8">
      {/* Party icon */}
      <div className="flex justify-center">
        <div className={pct < 70 ? 'rounded-full ring-2 ring-orange-400 ring-offset-2 animate-pulse p-2' : ''}>
          <PartyPopper className="h-14 w-14 text-orange-500 animate-in zoom-in-50 duration-500" strokeWidth={1.5} />
        </div>
      </div>

      {/* Score */}
      <div>
        <p className="text-5xl font-extrabold">{pct}%</p>
        <p className="text-muted-foreground mt-1 text-sm">{sessionLabel}</p>
      </div>

      {/* Correct / missed stats */}
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="text-sm font-medium text-primary">{correct} correctas</span>
        </div>
        {missed > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-[var(--d5-warm)]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-[var(--d5-warm)]">{missed} por repasar</span>
          </div>
        )}
      </div>

      {/* Per-tense breakdown */}
      {sorted.length > 0 && (
        <section className="senda-card text-left space-y-3">
          <p className="senda-eyebrow">Por tiempo verbal</p>
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
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onPracticeAgain}
          className="senda-cta w-full active:scale-95 transition-transform"
        >
          Practicar de nuevo
        </button>
        <Link href="/verbs" className="senda-cta-outline">
          Ver verbos
        </Link>
      </div>
    </div>
  )
}
