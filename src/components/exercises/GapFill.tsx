'use client'

import { useState, useRef, useEffect, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SpeakButton } from '@/components/SpeakButton'
import { AnnotatedText } from '@/components/AnnotatedText'
import type { Exercise, AnnotationSpan } from '@/lib/supabase/types'
import { splitPromptOnBlanks, countBlanks, encodeAnswers, parseExpectedAnswers } from '@/lib/exercises/gapFill'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

/**
 * Extract annotation spans that belong to a given text segment.
 * Walks through the full annotation list, collecting spans that fall within
 * the range of characters occupied by the segment in the full prompt.
 */
function sliceAnnotationsForSegment(
  annotations: AnnotationSpan[] | null | undefined,
  fullPrompt: string,
  segment: string,
  segmentIndex: number,
  segments: string[],
  blankCount: number,
): AnnotationSpan[] | null {
  if (!annotations || annotations.length === 0) return null

  // Find the character offset of this segment in the full prompt.
  // Segments interleave with blank tokens (___). We reconstruct the offset
  // by joining segments back with the blank token to find segment positions.
  const BLANK = '___'
  let offset = 0
  for (let i = 0; i < segmentIndex; i++) {
    offset += segments[i].length
    if (i < blankCount) offset += BLANK.length
  }

  const segStart = offset
  const segEnd = segStart + segment.length

  // Walk the annotation spans to find those that fall within [segStart, segEnd)
  let spanOffset = 0
  const result: AnnotationSpan[] = []

  for (const span of annotations) {
    const spanStart = spanOffset
    const spanEnd = spanOffset + span.text.length

    // Overlap check
    if (spanEnd > segStart && spanStart < segEnd) {
      const clampStart = Math.max(spanStart, segStart) - spanStart
      const clampEnd = Math.min(spanEnd, segEnd) - spanStart
      result.push({ text: span.text.slice(clampStart, clampEnd), form: span.form })
    }

    spanOffset += span.text.length
    if (spanOffset >= segEnd) break
  }

  return result.length > 0 ? result : null
}

export function GapFill({ exercise, onSubmit, disabled }: Props) {
  const segments = splitPromptOnBlanks(exercise.prompt)
  const blankCount = countBlanks(exercise.prompt)
  const hasInlineBlanks = blankCount >= 1

  const [answers, setAnswers] = useState<string[]>(() => Array(Math.max(blankCount, 1)).fill(''))
  const [singleAnswer, setSingleAnswer] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const singleInputRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  // Focus first input without triggering iOS scroll
  useEffect(() => {
    const el = hasInlineBlanks ? inputRefs.current[0] : singleInputRef.current
    el?.focus({ preventScroll: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const expectedAnswers = parseExpectedAnswers(exercise.expected_answer)

  function getHintWidth(blankIndex: number): number {
    const len = expectedAnswers
      ? (expectedAnswers[blankIndex]?.length ?? 6)
      : (exercise.expected_answer?.length ?? 6)
    return Math.max(5, len + 2)
  }

  function handleKeyDown(i: number) {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const next = inputRefs.current[i + 1]
        if (next) next.focus()
        else submitRef.current?.focus()
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hasInlineBlanks) {
      if (!answers.every((a) => a.trim())) return
      if (blankCount === 1) {
        onSubmit(answers[0].trim())
      } else {
        onSubmit(encodeAnswers(answers.map((a) => a.trim())))
      }
    } else {
      if (!singleAnswer.trim()) return
      onSubmit(singleAnswer.trim())
    }
  }

  const allFilled = hasInlineBlanks
    ? answers.every((a) => a.trim())
    : !!singleAnswer.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        {hasInlineBlanks ? (
          <div className="senda-heading text-base leading-relaxed flex-1 flex flex-wrap items-baseline gap-x-1 gap-y-2" style={{ fontWeight: 600 }}>
            {segments.map((segment, i) => (
              <Fragment key={i}>
                <span>
                  <AnnotatedText
                    text={segment}
                    annotations={sliceAnnotationsForSegment(
                      exercise.annotations,
                      exercise.prompt,
                      segment,
                      i,
                      segments,
                      blankCount,
                    )}
                  />
                </span>
                {i < blankCount && (
                  <input
                    ref={(el) => { inputRefs.current[i] = el }}
                    value={answers[i]}
                    onChange={(e) => {
                      const next = [...answers]
                      next[i] = e.target.value
                      setAnswers(next)
                    }}
                    onKeyDown={handleKeyDown(i)}
                    aria-label={blankCount > 1 ? `Hueco ${i + 1}` : 'Tu respuesta'}
                    disabled={disabled}
                    className="inline-block border-0 border-b-2 border-[var(--d5-muted)] focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d5-terracotta)] bg-transparent text-base font-medium text-center transition-colors duration-150 py-0.5 align-text-bottom"
                    style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif', fontStyle: 'normal', width: `${getHintWidth(i)}ch` }}
                  />
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <p className="senda-heading text-base leading-relaxed flex-1">
            <AnnotatedText text={exercise.prompt} annotations={exercise.annotations} />
          </p>
        )}
        <SpeakButton text={exercise.prompt} />
      </div>

      {!hasInlineBlanks && (
        <div className="senda-dashed-input">
          <Input
            ref={singleInputRef}
            value={singleAnswer}
            onChange={(e) => setSingleAnswer(e.target.value)}
            placeholder="Escribe tu respuesta…"
            disabled={disabled}
            className="text-base border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
          />
        </div>
      )}

      <Button ref={submitRef} type="submit" disabled={disabled || !allFilled} className="w-full rounded-full">
        Confirmar →
      </Button>
    </form>
  )
}
