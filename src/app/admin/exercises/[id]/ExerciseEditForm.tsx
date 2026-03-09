'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ExerciseData {
  id: string
  type: string
  prompt: string
  expected_answer: string | null
  hint_1: string | null
  hint_2: string | null
  concept_title: string
}

interface Props {
  exercise: ExerciseData
}

export function ExerciseEditForm({ exercise }: Props) {
  const [prompt, setPrompt] = useState(exercise.prompt)
  const [expectedAnswer, setExpectedAnswer] = useState(exercise.expected_answer ?? '')
  const [hint1, setHint1] = useState(exercise.hint_1 ?? '')
  const [hint2, setHint2] = useState(exercise.hint_2 ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/admin/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          expected_answer: expectedAnswer || null,
          hint_1: hint1 || null,
          hint_2: hint2 || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          required
          maxLength={2000}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Expected answer
        </label>
        <textarea
          value={expectedAnswer}
          onChange={(e) => setExpectedAnswer(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Hint 1
          </label>
          <textarea
            value={hint1}
            onChange={(e) => setHint1(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Hint 2
          </label>
          <textarea
            value={hint2}
            onChange={(e) => setHint2(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </Button>
        {status === 'saved' && (
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">Saved ✓</p>
        )}
      </div>
    </form>
  )
}
