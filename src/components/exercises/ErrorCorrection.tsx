'use client'

import { useState, useRef } from 'react'
import { useAutoFocus } from '@/lib/hooks/useAutoFocus'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AnnotatedText } from '@/components/AnnotatedText'
import { SpeakButton } from '@/components/SpeakButton'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useAutoFocus(textareaRef)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        <p className="senda-heading text-base leading-relaxed flex-1">{exercise.prompt}</p>
        <SpeakButton text={exercise.prompt} />
      </div>

      {erroneous && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3 text-sm">
          <span className="font-semibold text-[var(--d5-warm)]">Frase errónea: </span>
          <span className="italic text-foreground">
            <AnnotatedText
              text={erroneous}
              annotations={sliceAnnotationsForSentence(exercise.annotations, exercise.prompt, erroneous)}
            />
          </span>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs text-[var(--d5-muted)]">Escribe la frase corregida:</p>
        <div className="senda-dashed-input">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Escribe la frase corregida…"
            disabled={disabled}
            rows={3}
            className="text-base resize-none border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={disabled || !value.trim()} className="flex-1 rounded-full">
          Confirmar →
        </Button>
      </div>
    </form>
  )
}
