'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SpeakButton } from '@/components/SpeakButton'
import type { Exercise } from '@/lib/supabase/types'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

// Extract the word list from the prompt: looks for [...] bracket notation
function parseWords(prompt: string): string[] {
  const match = prompt.match(/\[([^\]]+)\]/)
  if (!match) return []
  return match[1].split('/').map((w) => w.trim()).filter(Boolean)
}

export function SentenceBuilder({ exercise, onSubmit, disabled }: Props) {
  const [words] = useState(() => {
    const parsed = parseWords(exercise.prompt)
    return [...parsed].sort(() => Math.random() - 0.5)
  })

  const [selected, setSelected] = useState<string[]>([])
  const [remaining, setRemaining] = useState<string[]>(words)
  // Fallback state for when no bracket notation is found (must be declared unconditionally)
  const [fallbackValue, setFallbackValue] = useState('')

  const sentence = selected.join(' ')

  function addWord(word: string, idx: number) {
    setSelected((s) => [...s, word])
    setRemaining((r) => r.filter((_, i) => i !== idx))
  }

  function removeWord(idx: number) {
    const word = selected[idx]
    setSelected((s) => s.filter((_, i) => i !== idx))
    setRemaining((r) => [...r, word])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sentence.trim()) return
    onSubmit(sentence.trim())
  }

  // Fallback: if no bracket notation found, show as plain text answer
  if (words.length === 0) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(fallbackValue.trim()) }} className="space-y-4">
        <div className="flex items-start gap-2">
          <p className="senda-heading text-base leading-relaxed flex-1">{exercise.prompt}</p>
          <SpeakButton text={exercise.prompt} />
        </div>
        <div className="senda-dashed-input">
          <input
            className="w-full border-0 bg-transparent text-base outline-none focus-visible:ring-2 focus-visible:ring-[var(--d5-terracotta)]"
            value={fallbackValue}
            onChange={(e) => setFallbackValue(e.target.value)}
            placeholder="Construye tu frase…"
            disabled={disabled}
            autoFocus
          />
        </div>
        <Button type="submit" disabled={disabled || !fallbackValue.trim()} className="w-full rounded-full">Confirmar →</Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Instruction (strip the bracket part) */}
      <div className="flex items-start gap-2">
        <p className="senda-heading text-base leading-relaxed flex-1">
          {exercise.prompt.replace(/\s*\[[^\]]+\]/, '')}
        </p>
        <SpeakButton text={exercise.prompt.replace(/\s*\[[^\]]+\]/, '')} />
      </div>

      {/* Construction area */}
      <div className="senda-dashed-input min-h-12 flex flex-wrap gap-2">
        {selected.length === 0 && (
          <span className="text-sm text-[var(--d5-muted)] self-center">Toca las palabras para construir tu frase…</span>
        )}
        {selected.map((word, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && removeWord(i)}
            aria-label={`Remover palabra ${word}`}
            className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 disabled:opacity-50 active:scale-95 transition-transform"
            disabled={disabled}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {remaining.map((word, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && addWord(word, i)}
            aria-label={`Agregar palabra ${word}`}
            className="px-3 py-1 bg-[var(--d5-pill-bg)] text-[var(--d5-pill-text)] border border-[var(--d5-pill-border)] rounded-full text-sm hover:bg-[var(--d5-pill-bg)] disabled:opacity-50 active:scale-95 transition-transform senda-focus-ring"
            disabled={disabled}
          >
            {word}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => { setSelected([]); setRemaining(words) }}
          disabled={disabled || selected.length === 0}
          className="rounded-full"
        >
          Reiniciar
        </Button>
        <Button type="submit" disabled={disabled || selected.length === 0} className="flex-1 rounded-full">
          Confirmar →
        </Button>
      </div>
    </form>
  )
}
