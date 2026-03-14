'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SpeakButton } from '@/components/SpeakButton'
import { Play, RotateCcw, Loader2 } from 'lucide-react'
import type { Exercise } from '@/lib/supabase/types'

/**
 * Parse a listening comprehension prompt.
 * Format: "PASSAGE: ...\nQUESTION: ..."
 */
export function parseListeningPrompt(prompt: string): { passage: string; question: string } {
  const qIdx = prompt.indexOf('\nQUESTION:')
  if (qIdx === -1) {
    return { passage: prompt, question: '' }
  }
  const passage = prompt.slice(prompt.startsWith('PASSAGE:') ? 8 : 0, qIdx).trim()
  const question = prompt.slice(qIdx + 10).trim()
  return { passage, question }
}

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function ListeningComprehension({ exercise, onSubmit, disabled }: Props) {
  const { passage, question } = parseListeningPrompt(exercise.prompt)
  const [answer, setAnswer] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playCount, setPlayCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchAndPlay = useCallback(async () => {
    // If already fetched, just replay
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setPlayCount((c) => c + 1)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: passage }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate audio')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setPlayCount(1)

      // Play immediately
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio error')
    } finally {
      setLoading(false)
    }
  }, [audioUrl, passage])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Audio player section */}
      <div className="senda-card flex flex-col items-center gap-3 py-6">
        <p className="senda-eyebrow">Comprensión Auditiva</p>

        {playCount === 0 ? (
          <Button
            type="button"
            onClick={fetchAndPlay}
            disabled={disabled || loading}
            className="h-14 w-14 rounded-full p-0"
            aria-label="Reproducir pasaje"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={fetchAndPlay}
              disabled={disabled || loading}
              variant="outline"
              className="rounded-full gap-2"
              aria-label="Escuchar de nuevo"
            >
              <RotateCcw className="h-4 w-4" />
              Escuchar de nuevo
              <span className="ml-1 text-xs text-[var(--d5-muted)]">({playCount})</span>
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Question */}
      {question && (
        <div className="flex items-start gap-2">
          <p className="senda-heading text-base leading-relaxed flex-1">{question}</p>
        </div>
      )}

      {/* Answer textarea */}
      <div className="senda-dashed-input">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu respuesta en español…"
          disabled={disabled}
          rows={3}
          className="text-base resize-none border-0 shadow-none bg-transparent focus-visible:ring-0 px-0"
        />
      </div>

      <Button type="submit" disabled={disabled || !answer.trim()} className="w-full rounded-full">
        Confirmar →
      </Button>

      {/* Hidden audio element for playback control */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
    </form>
  )
}
