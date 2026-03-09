import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import type { VerbGradeResult } from '@/lib/verbs/grader'

interface Props {
  result: VerbGradeResult
  onNext: () => void
  onTryAgain: () => void
  isLast: boolean
}

export function VerbFeedbackPanel({ result, onNext, onTryAgain, isLast }: Props) {
  const { outcome, userAnswer, correctForm, tenseRule } = result

  if (outcome === 'correct') {
    return (
      <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 space-y-1">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Correct!
        </div>
        <p className="text-sm text-green-800 dark:text-green-300 font-medium">{correctForm}</p>
      </div>
    )
  }

  if (outcome === 'accent_error') {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Almost — check your accents
        </div>
        <p className="text-sm text-muted-foreground">
          You wrote: <span className="font-medium text-foreground">{userAnswer}</span>
          {' '}· Correct: <span className="font-medium text-foreground">{correctForm}</span>
        </p>
        <button
          onClick={onNext}
          className="mt-1 w-full rounded-xl bg-amber-500 text-white py-2.5 text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          {isLast ? 'Finish →' : 'Next →'}
        </button>
      </div>
    )
  }

  // incorrect
  return (
    <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 space-y-2">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-sm">
        <XCircle className="h-4 w-4 shrink-0" />
        Not quite
      </div>
      <p className="text-sm text-muted-foreground">
        Correct form: <span className="font-medium text-foreground">{correctForm}</span>
      </p>
      {tenseRule && (
        <p className="text-xs text-muted-foreground border-t pt-2 mt-1">{tenseRule}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onTryAgain}
          data-testid="try-again-btn"
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {isLast ? 'Finish →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
