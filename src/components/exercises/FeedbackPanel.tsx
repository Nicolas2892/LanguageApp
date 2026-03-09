'use client'

import { Button } from '@/components/ui/button'
import { SCORE_CONFIG } from '@/lib/scoring'
import { CheckCircle2, XCircle, CalendarDays, Sparkles } from 'lucide-react'
import { SpeakButton } from '@/components/SpeakButton'
import type { GradeResult } from '@/lib/claude/grader'

interface Props {
  result: GradeResult & { next_review_in_days: number }
  userAnswer: string
  onNext: () => void
  onTryAgain?: () => void
  isLast: boolean
  isGenerating?: boolean
}

export function FeedbackPanel({ result, userAnswer, onNext, onTryAgain, isLast, isGenerating = false }: Props) {
  const config = SCORE_CONFIG[result.score]
  const isCorrect = result.is_correct

  return (
    <div className={`rounded-xl border overflow-hidden ${isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
      {/* Accent strip */}
      <div className={`h-1 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />

      <div className="p-5 space-y-4">
        {/* Score label — prominent */}
        <div className="text-center space-y-1">
          <p className="text-2xl font-black">
            {config.label}
            {result.score === 3 && (
              <Sparkles className="inline h-5 w-5 text-amber-400 ml-2 animate-in zoom-in-50 duration-300" strokeWidth={1.5} />
            )}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={1.5} />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" strokeWidth={1.5} />
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
              Back in {result.next_review_in_days} {result.next_review_in_days === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Feedback text — skeleton while streaming */}
        {result.feedback === '' ? (
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-base">{result.feedback}</p>
        )}

        {/* Your answer vs correct */}
        <div className="space-y-2 text-sm">
          {isCorrect ? (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border-l-4 border-green-400 px-3 py-2">
              {userAnswer}
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 px-3 py-2">
                {userAnswer}
              </div>
              {result.corrected_version && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border-l-4 border-green-400 px-3 py-2 flex items-center justify-between">
                  <span>{result.corrected_version}</span>
                  <SpeakButton text={result.corrected_version} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Explanation — skeleton while streaming */}
        {result.explanation === '' && result.feedback === '' ? (
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        ) : result.explanation ? (
          <p className="text-sm text-muted-foreground border-l-2 border-muted-foreground/30 pl-3 italic">
            {result.explanation}
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          {onTryAgain && (
            <Button variant="outline" onClick={onTryAgain} className="flex-1">
              Try again
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={isGenerating}
            className="flex-1 active:scale-95 transition-transform"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating…
              </span>
            ) : isLast ? 'Finish session' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
