'use client'

import { Button } from '@/components/ui/button'
import { SvgTilde } from '@/components/SvgTilde'
import type { VerbGradeResult } from '@/lib/verbs/grader'

interface Props {
  result: VerbGradeResult
  onNext: () => void
  onTryAgain: () => void
  isLast: boolean
  completedSentence?: string
}

export function VerbFeedbackPanel({ result, onNext, onTryAgain, isLast, completedSentence }: Props) {
  const { outcome, userAnswer, correctForm, tenseRule } = result

  const pillConfig = {
    correct: { label: '¡Correcto!', bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    accent_error: { label: 'Casi — revisa los acentos', bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    incorrect: { label: 'Incorrecto', bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  }
  const pill = pillConfig[outcome]

  return (
    <div className="senda-feedback-card space-y-4">
      {/* Tilde ornament */}
      <div className="flex justify-center">
        <SvgTilde size={52} />
      </div>

      {/* Outcome pill */}
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${pill.bg}`}>
          {pill.label}
        </span>
      </div>

      {/* Answer display */}
      <div className="space-y-2 text-sm">
        {outcome === 'correct' ? (
          <div className="senda-heading text-lg text-primary">{correctForm}</div>
        ) : (
          <>
            {outcome === 'accent_error' && (
              <p className="text-xs text-[var(--d5-muted)]">
                Tu respuesta: <span className="line-through decoration-1">{userAnswer}</span>
              </p>
            )}
            <div className="senda-heading text-lg text-primary">{correctForm}</div>
          </>
        )}
        {completedSentence && (
          <p className="text-xs text-[var(--d5-muted)]">{completedSentence}</p>
        )}
      </div>

      {/* Tense rule explanation */}
      {tenseRule && (
        <>
          <div className="h-px bg-[var(--d5-muted)] opacity-25" />
          <p className="text-sm text-[var(--d5-muted)] italic">{tenseRule}</p>
        </>
      )}

      {/* Buttons — only for non-correct outcomes (correct auto-advances) */}
      {outcome !== 'correct' && (
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={onNext}
            className="w-full rounded-full active:scale-95 transition-transform"
          >
            {isLast ? 'Finalizar sesión' : 'Siguiente →'}
          </Button>
          {outcome === 'incorrect' && (
            <Button
              variant="outline"
              onClick={onTryAgain}
              data-testid="try-again-btn"
              className="w-full rounded-full border-primary text-primary hover:bg-primary/5"
            >
              Intentar de nuevo
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
