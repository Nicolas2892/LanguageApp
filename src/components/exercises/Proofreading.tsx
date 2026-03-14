'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SpeakButton } from '@/components/SpeakButton'
import type { Exercise } from '@/lib/supabase/types'

/**
 * Parse a proofreading prompt.
 * Format: "TEXT: ...\nERRORS: N"
 */
export function parseProofreadingPrompt(prompt: string): { text: string; errorCount: number } {
  const errIdx = prompt.indexOf('\nERRORS:')
  if (errIdx === -1) {
    return { text: prompt, errorCount: 0 }
  }
  const text = prompt.slice(prompt.startsWith('TEXT:') ? 5 : 0, errIdx).trim()
  const errorCount = parseInt(prompt.slice(errIdx + 8).trim(), 10) || 0
  return { text, errorCount }
}

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function Proofreading({ exercise, onSubmit, disabled }: Props) {
  const { text, errorCount } = parseProofreadingPrompt(exercise.prompt)
  const [value, setValue] = useState(text)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="senda-eyebrow">Corrección De Texto</p>
          <p className="senda-heading text-base leading-relaxed">
            Encuentra y corrige los errores en el texto
          </p>
        </div>
        <SpeakButton text={text} />
      </div>

      {/* Error count badge */}
      {errorCount > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-200">
          <span aria-label={`${errorCount} errores`}>
            Este texto contiene {errorCount} {errorCount === 1 ? 'error' : 'errores'}
          </span>
        </div>
      )}

      {/* Pre-populated textarea */}
      <div className="senda-dashed-input">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Corrige el texto…"
          disabled={disabled}
          autoFocus
          rows={6}
          className="text-base resize-none border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
        />
      </div>

      <Button type="submit" disabled={disabled || !value.trim()} className="w-full rounded-full">
        Confirmar →
      </Button>
    </form>
  )
}
