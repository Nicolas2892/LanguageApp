'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Exercise } from '@/lib/supabase/types'

// Extract the erroneous sentence from the prompt.
// Prompts are like: 'Find and correct the error: "El alumno estudia mucho pero no aprueba."'
function extractSentence(prompt: string): string {
  const match = prompt.match(/"([^"]+)"/)
  return match ? match[1] : ''
}

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function ErrorCorrection({ exercise, onSubmit, disabled }: Props) {
  const erroneous = extractSentence(exercise.prompt)
  const [value, setValue] = useState(erroneous)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-lg leading-relaxed">{exercise.prompt}</p>

      {erroneous && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-900">
          <span className="font-semibold">Erroneous sentence: </span>
          <span className="italic">{erroneous}</span>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Edit the sentence below to correct it:</p>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          autoFocus
          rows={3}
          className="text-base resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setValue(erroneous)}
          disabled={disabled}
        >
          Reset
        </Button>
        <Button type="submit" disabled={disabled || !value.trim()} className="flex-1">
          Submit
        </Button>
      </div>
    </form>
  )
}
