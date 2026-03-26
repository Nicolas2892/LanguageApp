'use client'

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { gradeVocab } from '@/lib/vocab/grader'
import type { VocabGradeResult } from '@/lib/vocab/grader'
import { CATEGORY_LABELS } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'
import { SpeakButton } from '@/components/SpeakButton'
import { focusWithoutScroll } from '@/lib/hooks/useAutoFocus'

export interface VocabInlineItem {
  vocabId: string
  expression: string
  category: string
  sentence: string
  correctForm: string
  answerVariants: string[] | null
  english: string
  hint: string | null
}

export type VocabInlineOutcome = 'correct' | 'accent_error' | 'incorrect'

interface Props {
  item: VocabInlineItem
  showHint: boolean
  onGraded: (outcome: VocabInlineOutcome) => void
}

export function VocabExerciseInline({ item, showHint, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<VocabGradeResult | null>(null)
  const [flashClass, setFlashClass] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAnswer('')
    setResult(null)
    setFlashClass('')
    setTimeout(() => focusWithoutScroll(inputRef.current), 50)
  }, [item.vocabId])

  const categoryLabel = CATEGORY_LABELS[item.category as VocabCategory] ?? item.category
  const parts = item.sentence.split('_____')
  const completedSentence = item.sentence.replace('_____', item.correctForm)

  function handleCheck() {
    if (!answer.trim() || result) return
    const gradeResult = gradeVocab(answer, item.correctForm, item.answerVariants)

    const cls = gradeResult.outcome === 'correct'
      ? 'animate-flash-green'
      : gradeResult.outcome === 'accent_error'
      ? 'animate-flash-orange'
      : 'animate-flash-red'
    setFlashClass(cls)
    setTimeout(() => setFlashClass(''), 400)

    setResult(gradeResult)
    onGraded(gradeResult.outcome)
  }

  return (
    <div className={`space-y-4 ${flashClass}`}>
      {/* Eyebrow: category */}
      <div className="senda-eyebrow">{categoryLabel}</div>

      {/* Sentence with blank or completed */}
      <div className="senda-card space-y-3">
        <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--d5-ink)' }}>
          {result
            ? completedSentence
            : <>
                {parts[0]}
                <span className="inline-block min-w-[4rem] border-b-2 border-dashed mx-1" style={{ borderColor: 'var(--d5-muted)' }}>
                  {showHint && item.hint && <span className="text-xs" style={{ color: 'var(--d5-muted)' }}>[{item.hint}]</span>}
                </span>
                {parts[1]}
              </>
          }
        </p>

        <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>{item.english}</p>

        {result && <SpeakButton text={completedSentence} />}
      </div>

      {/* Input + check */}
      {!result && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="Expresión"
            className="senda-input flex-1"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!answer.trim()}
            className="shrink-0 rounded-full bg-primary text-primary-foreground p-2.5 disabled:opacity-50 transition-colors"
          >
            <Check size={18} />
          </button>
        </div>
      )}

      {/* Feedback */}
      {result && (
        <div className="text-sm space-y-1">
          {result.outcome === 'correct' && (
            <p className="font-semibold" style={{ color: 'var(--d5-terracotta)' }}>Correcto</p>
          )}
          {result.outcome === 'accent_error' && (
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              Casi — revisa los acentos: <span className="font-bold">{item.correctForm}</span>
            </p>
          )}
          {result.outcome === 'incorrect' && (
            <p className="font-semibold text-red-600 dark:text-red-400">
              Respuesta correcta: <span className="font-bold">{item.correctForm}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
