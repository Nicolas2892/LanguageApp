'use client'

import { useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SpeakButton } from '@/components/SpeakButton'
import { AnnotatedText } from '@/components/AnnotatedText'
import type { Exercise, AnnotationSpan } from '@/lib/supabase/types'
import { splitPromptOnBlanks, countBlanks, encodeAnswers } from '@/lib/exercises/gapFill'

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
  const isMultiBlank = blankCount >= 2

  const [answers, setAnswers] = useState<string[]>(() => Array(Math.max(blankCount, 1)).fill(''))
  const [singleAnswer, setSingleAnswer] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isMultiBlank) {
      if (!answers.every((a) => a.trim())) return
      onSubmit(encodeAnswers(answers.map((a) => a.trim())))
    } else {
      if (!singleAnswer.trim()) return
      onSubmit(singleAnswer.trim())
    }
  }

  const allFilled = isMultiBlank
    ? answers.every((a) => a.trim())
    : !!singleAnswer.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        {isMultiBlank ? (
          <div className="text-xl leading-relaxed font-medium flex-1 flex flex-wrap items-baseline gap-x-1 gap-y-2">
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
                  <Input
                    value={answers[i]}
                    onChange={(e) => {
                      const next = [...answers]
                      next[i] = e.target.value
                      setAnswers(next)
                    }}
                    disabled={disabled}
                    autoFocus={i === 0}
                    aria-label={`Blank ${i + 1}`}
                    className="inline-block w-28 text-base h-8 px-2"
                  />
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <p className="text-xl leading-relaxed font-medium flex-1">
            <AnnotatedText text={exercise.prompt} annotations={exercise.annotations} />
          </p>
        )}
        <SpeakButton text={exercise.prompt} />
      </div>

      {!isMultiBlank && (
        <div className="flex gap-2">
          <Input
            value={singleAnswer}
            onChange={(e) => setSingleAnswer(e.target.value)}
            placeholder="Type your answer…"
            disabled={disabled}
            autoFocus
            className="text-base"
          />
        </div>
      )}

      <Button type="submit" disabled={disabled || !allFilled} className="w-full">
        Submit
      </Button>
    </form>
  )
}
