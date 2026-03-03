'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SpeakButton } from '@/components/SpeakButton'
import type { Exercise } from '@/lib/supabase/types'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function TextAnswer({ exercise, onSubmit, disabled }: Props) {
  const [answer, setAnswer] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        <p className="text-xl leading-relaxed font-medium flex-1">{exercise.prompt}</p>
        <SpeakButton text={exercise.prompt} />
      </div>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer in Spanish…"
        disabled={disabled}
        autoFocus
        rows={4}
        className="text-base resize-none"
      />
      <Button type="submit" disabled={disabled || !answer.trim()} className="w-full">
        Submit
      </Button>
    </form>
  )
}
