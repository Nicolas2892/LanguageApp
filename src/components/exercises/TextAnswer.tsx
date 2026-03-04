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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        <p className="text-xl leading-relaxed font-medium flex-1">
          <AnnotatedText text={exercise.prompt} annotations={exercise.annotations} />
        </p>
        <SpeakButton text={exercise.prompt} />
      </div>
      <Textarea
        ref={textareaRef}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer in Spanish…"
        disabled={disabled}
        autoFocus
        className="text-base min-h-[6rem] overflow-hidden"
        style={{ resize: 'none' }}
      />
      <Button type="submit" disabled={disabled || !answer.trim()} className="w-full">
        Submit
      </Button>
    </form>
  )
}
