'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SpeakButton } from '@/components/SpeakButton'
import { MicButton } from '@/components/MicButton'
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition'

interface FreeWritePromptProps {
  prompt: string
  conceptTitle: string
  onSubmit: (answer: string) => void
  onRefreshPrompt: () => void
  disabled: boolean
  loadingPrompt: boolean
}

export function FreeWritePrompt({
  prompt,
  conceptTitle,
  onSubmit,
  onRefreshPrompt,
  disabled,
  loadingPrompt,
}: FreeWritePromptProps) {
  const [answer, setAnswer] = useState('')
  const stt = useSpeechRecognition()

  // Append recognised transcript to the answer textarea
  useEffect(() => {
    if (!stt.transcript) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswer((prev) => {
      if (!prev) return stt.transcript
      const separator = prev.endsWith(' ') ? '' : ' '
      return prev + separator + stt.transcript
    })
  }, [stt.transcript])

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const overLimit = wordCount > 200
  const underMinimum = wordCount > 0 && wordCount < 20

  function handleSubmit() {
    if (answer.trim() && !overLimit && !underMinimum) {
      onSubmit(answer.trim())
    }
  }

  const barPct = Math.min((wordCount / 200) * 100, 100)
  const barColor = overLimit ? 'bg-[var(--d5-error)]' : wordCount >= 150 ? 'bg-[var(--d5-warning)]' : 'bg-primary'

  return (
    <div className="space-y-4">
      {/* Concept label */}
      <div>
        <p className="senda-eyebrow mb-1.5">Concepto</p>
        <p className="text-sm text-[var(--d5-muted)]">{conceptTitle}</p>
      </div>

      {/* AI prompt */}
      <div className="senda-card min-h-[80px]">
        <div className="flex items-center gap-2 mb-2">
          <p className="senda-eyebrow flex-1">Tema de escritura</p>
          {!loadingPrompt && <SpeakButton text={prompt} />}
        </div>
        {loadingPrompt ? (
          <div className="space-y-2">
            <div className="h-4 rounded w-full animate-senda-pulse senda-skeleton-fill" />
            <div className="h-4 rounded w-4/5 animate-senda-pulse senda-skeleton-fill" />
            <div className="h-4 rounded w-3/5 animate-senda-pulse senda-skeleton-fill" />
          </div>
        ) : (
          <p className="senda-heading text-base">{prompt}</p>
        )}
      </div>

      {/* Answer textarea with mic button overlay */}
      <div className="relative">
        <textarea
          placeholder="Escribe tu respuesta en español…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled || loadingPrompt}
          rows={5}
          className="senda-dashed-input w-full resize-none pr-12"
        />
        <div className="absolute bottom-2 right-2">
          <MicButton stt={stt} disabled={disabled || loadingPrompt} />
        </div>
      </div>

      {/* Word count progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <div className="flex justify-end">
          <span className={`text-xs ${overLimit ? 'text-[var(--d5-error)]' : wordCount >= 150 ? 'text-[var(--d5-warning)]' : 'text-muted-foreground'}`}>
            {wordCount} / 200 palabras
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onRefreshPrompt}
          disabled={disabled || loadingPrompt}
          className="flex-1 rounded-full"
        >
          Generar otro tema
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={wordCount === 0 || overLimit || underMinimum || disabled || loadingPrompt}
          className="flex-1 rounded-full active:scale-95 transition-transform"
        >
          Enviar →
        </Button>
      </div>
    </div>
  )
}
