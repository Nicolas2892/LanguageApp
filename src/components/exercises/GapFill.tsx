'use client'

import { useState, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SpeakButton } from '@/components/SpeakButton'
import type { Exercise } from '@/lib/supabase/types'
import { splitPromptOnBlanks, countBlanks, encodeAnswers } from '@/lib/exercises/gapFill'

interface Props {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function GapFill({ exercise, onSubmit, disabled }: Props) {
  const segments = splitPromptOnBlanks(exercise.prompt)
  const blankCount = countBlanks(exercise.prompt)
  const isMultiBlank = blankCount >= 2

  const [answers, setAnswers] = useState<string[]>(() => Array(Math.max(blankCount, 1)).fill(''))
  const [singleAnswer, setSingleAnswer] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isMultiBlank) {
      if (!answers.every((a) => a.trim())) return
      onSubmit(encodeAnswers(answers.map((a) => a.trim())))
    } else {
      if (!singleAnswer.trim()) return
      onSubmit(singleAnswer.trim())
    }
  }

  const allFilled = isMultiBlank
    ? answers.every((a) => a.trim())
    : !!singleAnswer.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2">
        {isMultiBlank ? (
          <div className="text-xl leading-relaxed font-medium flex-1 flex flex-wrap items-baseline gap-x-1 gap-y-2">
            {segments.map((segment, i) => (
              <Fragment key={i}>
                <span>{segment}</span>
                {i < blankCount && (
                  <Input
                    value={answers[i]}
                    onChange={(e) => {
                      const next = [...answers]
                      next[i] = e.target.value
                      setAnswers(next)
                    }}
                    disabled={disabled}
                    autoFocus={i === 0}
                    aria-label={`Blank ${i + 1}`}
                    className="inline-block w-28 text-base h-8 px-2"
                  />
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <p className="text-xl leading-relaxed font-medium flex-1">{exercise.prompt}</p>
        )}
        <SpeakButton text={exercise.prompt} />
      </div>

      {!isMultiBlank && (
        <div className="flex gap-2">
          <Input
            value={singleAnswer}
            onChange={(e) => setSingleAnswer(e.target.value)}
            placeholder="Type your answer…"
            disabled={disabled}
            autoFocus
            className="text-base"
          />
        </div>
      )}

      <Button type="submit" disabled={disabled || !allFilled} className="w-full">
        Submit
      </Button>
    </form>
  )
}
