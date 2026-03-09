'use client'

import { useState, useMemo } from 'react'
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
  const words = useMemo(() => {
    const parsed = parseWords(exercise.prompt)
    // eslint-disable-next-line react-hooks/purity
    return [...parsed].sort(() => Math.random() - 0.5)
  }, [exercise.prompt])

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
          <p className="text-xl leading-relaxed font-medium flex-1">{exercise.prompt}</p>
          <SpeakButton text={exercise.prompt} />
        </div>
        <input
          className="w-full border rounded-md px-3 py-2 text-base"
          value={fallbackValue}
          onChange={(e) => setFallbackValue(e.target.value)}
          placeholder="Build your sentence…"
          disabled={disabled}
          autoFocus
        />
        <Button type="submit" disabled={disabled || !fallbackValue.trim()} className="w-full">Submit</Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Instruction (strip the bracket part) */}
      <div className="flex items-start gap-2">
        <p className="text-xl leading-relaxed font-medium flex-1">
          {exercise.prompt.replace(/\s*\[[^\]]+\]/, '')}
        </p>
        <SpeakButton text={exercise.prompt.replace(/\s*\[[^\]]+\]/, '')} />
      </div>

      {/* Construction area */}
      <div className="min-h-12 border-2 border-dashed rounded-lg p-3 flex flex-wrap gap-2 bg-muted/30">
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground self-center">Click words below to build your sentence…</span>
        )}
        {selected.map((word, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && removeWord(i)}
            className="px-3 py-1 bg-green-800 dark:bg-green-700 text-white rounded-full text-sm font-medium hover:bg-green-900 dark:hover:bg-green-600 disabled:opacity-50 active:scale-95 transition-transform"
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
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 active:scale-95 transition-transform"
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
        >
          Reset
        </Button>
        <Button type="submit" disabled={disabled || selected.length === 0} className="flex-1">
          Submit
        </Button>
      </div>
    </form>
  )
}
