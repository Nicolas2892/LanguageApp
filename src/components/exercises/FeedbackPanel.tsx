'use client'

import { Button } from '@/components/ui/button'
import { SCORE_CONFIG } from '@/lib/scoring'
import { CheckCircle2, XCircle, CalendarDays } from 'lucide-react'
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
    <div className={`rounded-xl border overflow-hidden ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
      {/* Accent strip */}
      <div className={`h-1 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />

      <div className="p-5 space-y-4">
        {/* Score + next review */}
        <div className="flex items-center gap-2 flex-wrap">
          {isCorrect ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${config.className}`}>
            {config.label}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1 ml-auto">
            <CalendarDays className="h-3.5 w-3.5" />
            Back in {result.next_review_in_days} {result.next_review_in_days === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Feedback text */}
        <p className="text-base">{result.feedback}</p>

        {/* Your answer vs correct */}
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Your answer:</span>
            <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span>
          </div>
          {!isCorrect && result.corrected_version && (
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground w-28 shrink-0">Correct:</span>
              <span className="text-green-700 font-medium flex-1">{result.corrected_version}</span>
              <SpeakButton text={result.corrected_version} />
            </div>
          )}
        </div>

        {/* Explanation */}
        {result.explanation && (
          <p className="text-sm text-muted-foreground border-l-2 border-orange-300 pl-3 italic">
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
