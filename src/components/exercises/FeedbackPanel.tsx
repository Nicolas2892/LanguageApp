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
}

export function FeedbackPanel({ result, userAnswer, onNext, onTryAgain, isLast }: Props) {
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
              <Sparkles className="inline h-5 w-5 text-amber-400 ml-2 animate-in zoom-in-50 duration-300" />
            )}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Back in {result.next_review_in_days} {result.next_review_in_days === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Feedback text */}
        <p className="text-base">{result.feedback}</p>

        {/* Your answer vs correct */}
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Your answer:</span>
            <span className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>{userAnswer}</span>
          </div>
          {!isCorrect && result.corrected_version && (
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground w-28 shrink-0">Correct:</span>
              <span className="text-green-700 dark:text-green-400 font-medium flex-1">{result.corrected_version}</span>
              <SpeakButton text={result.corrected_version} />
            </div>
          )}
        </div>

        {/* Explanation */}
        {result.explanation && (
          <p className="text-sm text-muted-foreground border-l-2 border-muted-foreground/30 pl-3 italic">
            {result.explanation}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {onTryAgain && (
            <Button variant="outline" onClick={onTryAgain} className="flex-1">
              Try again
            </Button>
          )}
          <Button onClick={onNext} className="flex-1 active:scale-95 transition-transform">
            {isLast ? 'Finish session' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
