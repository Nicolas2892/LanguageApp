'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Exercise } from '@/lib/supabase/types'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function GapFill({ exercise, onSubmit, disabled }: Props) {
  const [answer, setAnswer] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xl leading-relaxed font-medium">{exercise.prompt}</p>
      <div className="flex gap-2">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          disabled={disabled}
          autoFocus
          className="text-base"
        />
        <Button type="submit" disabled={disabled || !answer.trim()}>
          Submit
        </Button>
      </div>
    </form>
  )
}
