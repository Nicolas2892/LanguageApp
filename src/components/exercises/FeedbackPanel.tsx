'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SCORE_CONFIG } from '@/lib/scoring'
import { Sparkles, Bot } from 'lucide-react'
import { SpeakButton } from '@/components/SpeakButton'
import { SvgTilde } from '@/components/SvgTilde'
import type { GradeResult } from '@/lib/claude/grader'

interface Props {
  result: GradeResult & { next_review_in_days: number }
  userAnswer: string
  onNext: () => void
  onTryAgain?: () => void
  isLast: boolean
  isGenerating?: boolean
  conceptId?: string
}

export function FeedbackPanel({ result, userAnswer, onNext, onTryAgain, isLast, isGenerating = false, conceptId }: Props) {
  const config = SCORE_CONFIG[result.score]
  const isCorrect = result.is_correct

  return (
    <div className="senda-feedback-card space-y-4">
      {/* Tilde ornament */}
      <div className="flex justify-center">
        <SvgTilde size={52} />
      </div>

      {/* Score pill */}
      <div className="space-y-2">
        <span className="senda-score-pill">
          {result.score}/3 · {config.label}
          {result.score === 3 && (
            <Sparkles className="h-3.5 w-3.5 animate-in zoom-in-50 duration-300" strokeWidth={1.5} />
          )}
        </span>
        <p className="text-xs text-[var(--d5-muted)]">
          Próxima revisión en {result.next_review_in_days} {result.next_review_in_days === 1 ? 'día' : 'días'}
        </p>
      </div>

      {/* Feedback text — skeleton while streaming */}
      {result.feedback === '' ? (
        <div className="h-4 w-3/4 mx-auto senda-skeleton-fill animate-senda-pulse rounded" />
      ) : (
        <p className="text-sm text-foreground">{result.feedback}</p>
      )}

      {/* Answer display */}
      <div className="space-y-2 text-sm">
        {isCorrect ? (
          <div className="senda-heading text-lg text-primary">
            {userAnswer}
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-[var(--d5-error-surface)] px-4 py-2.5 text-foreground/70 line-through decoration-1">
              {userAnswer}
            </div>
            {result.corrected_version && (
              <div className="flex items-center justify-center gap-2">
                <span className="senda-heading text-lg text-primary">
                  {result.corrected_version}
                </span>
                <SpeakButton text={result.corrected_version} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Separator */}
      <div className="h-px bg-[var(--d5-muted)] opacity-25" />

      {/* Explanation — skeleton while streaming */}
      {result.explanation === '' && result.feedback === '' ? (
        <div className="h-4 w-1/2 mx-auto senda-skeleton-fill animate-senda-pulse rounded" />
      ) : result.explanation ? (
        <p className="text-sm text-[var(--d5-muted)] italic">
          {result.explanation}
        </p>
      ) : null}

      {/* Buttons — primary CTA first, secondary below */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          onClick={onNext}
          disabled={isGenerating}
          className="w-full rounded-full active:scale-95 transition-transform"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generando…
            </span>
          ) : isLast ? 'Finalizar sesión' : 'Siguiente →'}
        </Button>
        {onTryAgain && (
          <Button variant="outline" onClick={onTryAgain} className="w-full rounded-full border-primary text-primary hover:bg-primary/5">
            Intentar de nuevo
          </Button>
        )}
        {onTryAgain && conceptId && (
          <Link
            href={`/tutor?concept=${conceptId}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-[var(--d5-warm)] hover:text-primary transition-colors pt-1"
          >
            <Bot className="h-4 w-4" strokeWidth={1.5} />
            Preguntale al tutor →
          </Link>
        )}
      </div>
    </div>
  )
}
