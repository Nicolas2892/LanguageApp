'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  const barColor = overLimit ? 'bg-red-500' : wordCount >= 150 ? 'bg-amber-400' : 'bg-orange-500'

  return (
    <div className="space-y-4">
      {/* Concept label as orange pill */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
          Concept
        </p>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 text-xs font-semibold">
          {conceptTitle}
        </span>
      </div>

      {/* AI prompt */}
      <div className="border rounded-lg p-4 bg-muted/40 min-h-[80px]">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex-1">
            Writing prompt
          </p>
          {!loadingPrompt && <SpeakButton text={prompt} />}
        </div>
        {loadingPrompt ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-4/5" />
            <div className="h-4 bg-muted rounded w-3/5" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{prompt}</p>
        )}
      </div>

      {/* Answer textarea with mic button overlay */}
      <div className="relative">
        <Textarea
          placeholder="Write your answer in Spanish…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled || loadingPrompt}
          rows={5}
          className="resize-none pr-12"
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
          <span className={`text-xs ${overLimit ? 'text-red-500 dark:text-red-400' : wordCount >= 150 ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`}>
            {wordCount} / 200 words
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onRefreshPrompt}
          disabled={disabled || loadingPrompt}
          className="flex-1"
        >
          Generate different prompt
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={wordCount === 0 || overLimit || underMinimum || disabled || loadingPrompt}
          className="flex-1 active:scale-95 transition-transform"
        >
          Submit →
        </Button>
      </div>
    </div>
  )
}
