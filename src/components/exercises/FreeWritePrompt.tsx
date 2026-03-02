'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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

  function handleSubmit() {
    if (answer.trim()) {
      onSubmit(answer.trim())
    }
  }

  return (
    <div className="space-y-4">
      {/* Concept label */}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
          Concept
        </p>
        <p className="font-semibold text-sm">{conceptTitle}</p>
      </div>

      {/* AI prompt */}
      <div className="border rounded-lg p-4 bg-muted/40 min-h-[80px]">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
          Writing prompt
        </p>
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

      {/* Answer textarea */}
      <Textarea
        placeholder="Write your answer in Spanish…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled || loadingPrompt}
        rows={5}
        className="resize-none"
      />

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
          disabled={!answer.trim() || disabled || loadingPrompt}
          className="flex-1"
        >
          Submit →
        </Button>
      </div>
    </div>
  )
}
