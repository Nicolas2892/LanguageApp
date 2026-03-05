'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AnnotatedText } from '@/components/AnnotatedText'
import type { Exercise, AnnotationSpan } from '@/lib/supabase/types'

// Extract the erroneous sentence from the prompt.
// Prompts are like: 'Find and correct the error: "El alumno estudia mucho pero no aprueba."'
function extractSentence(prompt: string): string {
  const match = prompt.match(/"([^"]+)"/)
  return match ? match[1] : ''
}

// Extract annotation spans that correspond to the erroneous sentence substring.
function sliceAnnotationsForSentence(
  annotations: AnnotationSpan[] | null | undefined,
  fullPrompt: string,
  sentence: string,
): AnnotationSpan[] | null {
  if (!annotations || annotations.length === 0 || !sentence) return null

  const segStart = fullPrompt.indexOf(sentence)
  if (segStart === -1) return null
  const segEnd = segStart + sentence.length

  let spanOffset = 0
  const result: AnnotationSpan[] = []

  for (const span of annotations) {
    const spanStart = spanOffset
    const spanEnd = spanOffset + span.text.length

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

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function ErrorCorrection({ exercise, onSubmit, disabled }: Props) {
  const erroneous = extractSentence(exercise.prompt)
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-lg leading-relaxed">{exercise.prompt}</p>

      {erroneous && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-900 dark:text-red-300">
          <span className="font-semibold">Erroneous sentence: </span>
          <span className="italic">
            <AnnotatedText
              text={erroneous}
              annotations={sliceAnnotationsForSentence(exercise.annotations, exercise.prompt, erroneous)}
            />
          </span>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Type the corrected sentence below:</p>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type the corrected sentence…"
          disabled={disabled}
          autoFocus
          rows={3}
          className="text-base resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={disabled || !value.trim()} className="flex-1">
          Submit
        </Button>
      </div>
    </form>
  )
}
