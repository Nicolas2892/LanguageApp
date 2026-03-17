'use client'

import { useState, useRef } from 'react'
import { useAutoFocus } from '@/lib/hooks/useAutoFocus'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SpeakButton } from '@/components/SpeakButton'
import type { Exercise } from '@/lib/supabase/types'

const REGISTER_STYLES: Record<string, { label: string; color: string }> = {
  informal:   { label: 'Informal',   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  formal:     { label: 'Formal',     color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200' },
  coloquial:  { label: 'Coloquial',  color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
  académico:  { label: 'Académico',  color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
}

/**
 * Parse a register_shift prompt.
 * Format:
 *   SOURCE_REGISTER: informal
 *   TARGET_REGISTER: formal
 *   CONTEXT: Reescribe este mensaje para enviarlo como correo a tu supervisor.
 *   TEXT: ...
 */
export function parseRegisterPrompt(prompt: string): {
  sourceRegister: string
  targetRegister: string
  context: string
  text: string
} {
  const lines = prompt.split('\n')
  let sourceRegister = ''
  let targetRegister = ''
  let context = ''
  let textStartIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('SOURCE_REGISTER:')) {
      sourceRegister = line.slice(16).trim().toLowerCase()
    } else if (line.startsWith('TARGET_REGISTER:')) {
      targetRegister = line.slice(16).trim().toLowerCase()
    } else if (line.startsWith('CONTEXT:')) {
      context = line.slice(8).trim()
    } else if (line.startsWith('TEXT:')) {
      textStartIdx = i
      break
    }
  }

  const text = textStartIdx >= 0
    ? lines.slice(textStartIdx).join('\n').slice(5).trim()
    : prompt

  return { sourceRegister, targetRegister, context, text }
}

function RegisterBadge({ register }: { register: string }) {
  const style = REGISTER_STYLES[register] ?? { label: register, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.color}`}>
      {style.label}
    </span>
  )
}

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function RegisterShift({ exercise, onSubmit, disabled }: Props) {
  const { sourceRegister, targetRegister, context, text } = parseRegisterPrompt(exercise.prompt)
  const [answer, setAnswer] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useAutoFocus(textareaRef)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="senda-eyebrow">Cambio De Registro</p>
      </div>

      {/* Source text card */}
      <div className="senda-card space-y-2">
        <div className="flex items-center gap-2">
          <RegisterBadge register={sourceRegister} />
          <SpeakButton text={text} />
        </div>
        <p className="text-base leading-relaxed">{text}</p>
      </div>

      {/* Target register + context */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[var(--d5-warm)]">→</span>
        <RegisterBadge register={targetRegister} />
        {context && (
          <p className="text-sm text-[var(--d5-muted)] italic">{context}</p>
        )}
      </div>

      {/* Answer textarea */}
      <div className="senda-dashed-input">
        <Textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu respuesta en el nuevo registro…"
          disabled={disabled}
          rows={4}
          className="text-base resize-none border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
        />
      </div>

      <Button type="submit" disabled={disabled || !answer.trim()} className="w-full rounded-full">
        Confirmar →
      </Button>
    </form>
  )
}
