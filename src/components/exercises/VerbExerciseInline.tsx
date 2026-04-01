'use client'

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { gradeConjugation } from '@/lib/verbs/grader'
import type { VerbGradeResult } from '@/lib/verbs/grader'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import type { VerbTense } from '@/lib/verbs/constants'
import { SpeakButton } from '@/components/SpeakButton'
import { focusWithoutScroll } from '@/lib/hooks/useAutoFocus'

export interface VerbInlineItem {
  verbId: string
  infinitive: string
  tense: string
  pronoun: string
  sentence: string
  correctForm: string
  tenseRule: string
  english: string | null
}

export type VerbInlineOutcome = 'correct' | 'accent_error' | 'incorrect'

interface Props {
  item: VerbInlineItem
  showHint: boolean
  onGraded: (outcome: VerbInlineOutcome) => void
}

const PRONOUN_LABELS: Record<string, string> = {
  yo: 'yo', tu: 'tú', el: 'él/ella',
  nosotros: 'nosotros', vosotros: 'vosotros', ellos: 'ellos/ellas',
}

export function VerbExerciseInline({ item, showHint, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<VerbGradeResult | null>(null)
  const [flashClass, setFlashClass] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // State reset handled by key prop on parent — remount resets all state
  useEffect(() => {
    setTimeout(() => focusWithoutScroll(inputRef.current), 50)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isInfinitive = item.tense === 'infinitive'
  const tenseLabel = TENSE_LABELS[item.tense as VerbTense] ?? item.tense
  const pronounLabel = PRONOUN_LABELS[item.pronoun] ?? item.pronoun

  // Build display sentence with blank
  const parts = item.sentence.split('_____')
  const completedSentence = item.sentence.replace('_____', item.correctForm)

  function handleCheck() {
    if (!answer.trim() || result) return
    const gradeResult = gradeConjugation(answer, item.correctForm, item.tenseRule)

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
      {/* Eyebrow: tense + pronoun */}
      <div className="senda-eyebrow">
        {isInfinitive ? 'Infinitivo' : `${tenseLabel} · ${pronounLabel}`}
      </div>

      {/* Sentence with blank or completed */}
      <div className="senda-card space-y-3">
        <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--d5-ink)' }}>
          {result
            ? completedSentence
            : <>
                {parts[0]}
                <span className="inline-block min-w-[4rem] border-b-2 border-dashed mx-1" style={{ borderColor: 'var(--d5-muted)' }}>
                  {showHint && <span className="text-xs" style={{ color: 'var(--d5-muted)' }}>[{item.infinitive}]</span>}
                </span>
                {parts[1]}
              </>
          }
        </p>

        {item.english && (
          <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>{item.english}</p>
        )}

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
            placeholder={isInfinitive ? 'Infinitivo en español' : 'Conjugación'}
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
          <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>{item.tenseRule}</p>
        </div>
      )}
    </div>
  )
}
