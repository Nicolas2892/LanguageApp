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
        <p className="senda-heading text-base leading-relaxed flex-1">
          <AnnotatedText text={exercise.prompt} annotations={exercise.annotations} />
        </p>
        <SpeakButton text={exercise.prompt} />
      </div>
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
