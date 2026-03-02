'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
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
    // Shuffle
    return [...parsed].sort(() => Math.random() - 0.5)
  }, [exercise.prompt])

  const [selected, setSelected] = useState<string[]>([])
  const [remaining, setRemaining] = useState<string[]>(words)

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
    const [value, setValue] = useState('')
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(value.trim()) }} className="space-y-4">
        <p className="text-lg leading-relaxed">{exercise.prompt}</p>
        <input
          className="w-full border rounded-md px-3 py-2 text-base"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Build your sentence…"
          disabled={disabled}
          autoFocus
        />
        <Button type="submit" disabled={disabled || !value.trim()} className="w-full">Submit</Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Instruction (strip the bracket part) */}
      <p className="text-lg leading-relaxed">
        {exercise.prompt.replace(/\s*\[[^\]]+\]/, '')}
      </p>

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
            className="px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/80 disabled:opacity-50"
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
            className="px-2.5 py-1 border rounded-md text-sm hover:bg-muted disabled:opacity-50"
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
