'use client'

import { Button } from '@/components/ui/button'
import type { GradeResult } from '@/lib/claude/grader'

const SCORE_CONFIG = {
  3: { label: 'Perfect', className: 'bg-green-100 text-green-800 border-green-200' },
  2: { label: 'Good', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  1: { label: 'Needs work', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  0: { label: 'Incorrect', className: 'bg-red-100 text-red-800 border-red-200' },
}

interface Props {
  result: GradeResult & { next_review_in_days: number }
  userAnswer: string
  onNext: () => void
  onTryAgain?: () => void
  isLast: boolean
}

export function FeedbackPanel({ result, userAnswer, onNext, onTryAgain, isLast }: Props) {
  const config = SCORE_CONFIG[result.score]

  return (
    <div className="space-y-5">
      {/* Score badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.className}`}>
          {config.label}
        </span>
        <span className="text-sm text-muted-foreground">
          Next review in {result.next_review_in_days} {result.next_review_in_days === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Feedback */}
      <p className="text-base">{result.feedback}</p>

      {/* Your answer vs correct */}
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="text-muted-foreground w-28 shrink-0">Your answer:</span>
          <span className={result.is_correct ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span>
        </div>
        {!result.is_correct && (
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Correct:</span>
            <span className="text-green-700 font-medium">{result.corrected_version}</span>
          </div>
        )}
      </div>

      {/* Explanation */}
      {result.explanation && (
        <p className="text-sm text-muted-foreground border-l-2 pl-3 italic">
          {result.explanation}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        {onTryAgain && (
          <Button variant="outline" onClick={onTryAgain} className="flex-1">
            Try again
          </Button>
        )}
        <Button onClick={onNext} className="flex-1">
          {isLast ? 'Finish session' : 'Next →'}
        </Button>
      </div>
    </div>
  )
}
