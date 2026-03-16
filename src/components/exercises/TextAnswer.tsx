'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SpeakButton } from '@/components/SpeakButton'
import { AnnotatedText } from '@/components/AnnotatedText'
import type { Exercise } from '@/lib/supabase/types'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

/**
 * Split a translation/transformation prompt into instruction + source sentence(s).
 * Returns null if the prompt doesn't match any known pattern (renders as-is).
 *
 * Known patterns:
 *   - 'Translate: "sentence"'
 *   - 'Rewrite using "x": "sentence"'
 *   - 'Combine using "x": "s1" + "s2"'
 *   - 'Replace "x" with ...: "sentence"'
 *   - 'Base: sentence. → instruction'
 *   - 'instruction: "sentence" → hint'
 */
export function splitPrompt(prompt: string): { instruction: string; source: string } | null {
  // Pattern 1: "Base: <sentence>. → <instruction>" (AI-generated)
  const baseArrowMatch = prompt.match(/^Base:\s*(.+?)\s*→\s*(.+)$/)
  if (baseArrowMatch) {
    return { instruction: baseArrowMatch[2].trim(), source: baseArrowMatch[1].trim() }
  }

  // Pattern 2: "<instruction>: "sentence" → "hint"" or "<instruction>: "sentence""
  // Find the first colon followed by a quoted sentence
  const colonQuoteMatch = prompt.match(/^(.+?):\s*"(.+)"(.*)$/)
  if (colonQuoteMatch) {
    const instruction = colonQuoteMatch[1].trim()
    let source = `"${colonQuoteMatch[2].trim()}"`
    // Append any trailing part (e.g. → "Tomorrow...")
    const trailing = colonQuoteMatch[3].trim()
    if (trailing) {
      source += ` ${trailing}`
    }
    return { instruction, source }
  }

  return null
}

export function TextAnswer({ exercise, onSubmit, disabled }: Props) {
  const [answer, setAnswer] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    autoResize()
  }, [answer])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer.trim())
  }

  const isTransformType = exercise.type === 'translation' || exercise.type === 'transformation'
  const parsed = isTransformType ? splitPrompt(exercise.prompt) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {parsed ? (
        /* Split layout: instruction above, source sentence in styled card */
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <p className="text-sm text-[var(--d5-warm)] flex-1">
              ↳ {parsed.instruction}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-1 rounded-xl bg-[rgba(140,106,63,0.07)] dark:bg-[rgba(184,170,153,0.10)] border border-[var(--d5-muted)]/20 px-4 py-3">
              <p className="senda-heading text-base leading-relaxed">
                <AnnotatedText text={parsed.source} annotations={exercise.annotations} />
              </p>
            </div>
            <SpeakButton text={parsed.source} />
          </div>
        </div>
      ) : (
        /* Default: single block (free_write or unrecognised prompt format) */
        <div className="flex items-start gap-2">
          <p className="senda-heading text-base leading-relaxed flex-1">
            <AnnotatedText text={exercise.prompt} annotations={exercise.annotations} />
          </p>
          <SpeakButton text={exercise.prompt} />
        </div>
      )}
      <div className="senda-dashed-input">
        <Textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu respuesta en español…"
          disabled={disabled}
          autoFocus
          className="text-base min-h-[6rem] overflow-hidden border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
          style={{ resize: 'none' }}
        />
      </div>
      <Button type="submit" disabled={disabled || !answer.trim()} className="w-full rounded-full">
        Confirmar →
      </Button>
    </form>
  )
}
