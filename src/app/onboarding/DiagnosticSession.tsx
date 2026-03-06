'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { Progress } from '@/components/ui/progress'
import { SCORE_CONFIG } from '@/lib/scoring'
import type { Concept, Exercise } from '@/lib/supabase/types'
import type { GradeResult } from '@/lib/claude/grader'

export interface DiagnosticItem {
  concept: Concept
  exercise: Exercise
}

interface DiagnosticResult {
  concept_id: string
  exercise_id: string
  user_answer: string
  score: number
}

interface Props {
  items: DiagnosticItem[]
}

type SessionState =
  | { phase: 'answering' }
  | { phase: 'feedback'; result: GradeResult; userAnswer: string }
  | { phase: 'done' }


export function DiagnosticSession({ items }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<SessionState>({ phase: 'answering' })
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const current = items[index]
  const progress = (index / items.length) * 100

  async function handleSubmit(answer: string) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: current.exercise.id,
          concept_id: current.concept.id,
          user_answer: answer,
        }),
      })
      const result = await res.json() as GradeResult & { next_review_in_days: number }
      setResults((prev) => [
        ...prev,
        {
          concept_id: current.concept.id,
          exercise_id: current.exercise.id,
          user_answer: answer,
          score: result.score,
        },
      ])
      setState({ phase: 'feedback', result, userAnswer: answer })
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleNext() {
    if (index + 1 >= items.length) {
      // All done — call the completion endpoint
      setCompleting(true)
      setState({ phase: 'done' })
      try {
        // Include the current result already stored
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results }),
        })
      } catch {
        // Best-effort — still redirect
      } finally {
        router.push('/dashboard')
      }
    } else {
      setIndex((i) => i + 1)
      setState({ phase: 'answering' })
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-muted-foreground text-sm">
          No diagnostic exercises found. Please contact support or{' '}
          <a href="/dashboard" className="underline">skip to dashboard</a>.
        </p>
      </div>
    )
  }

  if (state.phase === 'done') {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="text-4xl">🎉</div>
        <p className="font-semibold text-lg">All done — your study queue is being built.</p>
        <p className="text-sm text-muted-foreground">
          {completing ? 'Personalising your study queue…' : 'Redirecting to dashboard…'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full inline-block ${i <= index ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <Progress value={progress} className="h-2 transition-all duration-700" />
      </div>

      {/* Concept context */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Concept</p>
        <p>{current.concept.explanation}</p>
      </div>

      {/* Exercise */}
      <div className="space-y-3">
        {state.phase === 'answering' && (
          <>
            <ExerciseRenderer exercise={current.exercise} onSubmit={handleSubmit} disabled={submitting} />
            {submitting && (
              <p className="text-sm text-muted-foreground animate-pulse">Thinking…</p>
            )}
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </>
        )}

        {state.phase === 'feedback' && (() => {
          const config = SCORE_CONFIG[state.result.score]
          return (
            <div className="space-y-4">
              {/* Score badge */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.className}`}>
                  {config.label}
                </span>
              </div>

              {/* Feedback */}
              <p className="text-base">{state.result.feedback}</p>

              {/* Answer comparison */}
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Your answer:</span>
                  <span className={state.result.is_correct ? 'text-green-700' : 'text-red-700'}>
                    {state.userAnswer}
                  </span>
                </div>
                {!state.result.is_correct && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Correct:</span>
                    <span className="text-green-700 font-medium">{state.result.corrected_version}</span>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {state.result.explanation && (
                <p className="text-sm text-muted-foreground border-l-2 pl-3 italic">
                  {state.result.explanation}
                </p>
              )}

              <button
                onClick={handleNext}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90"
              >
                {index + 1 >= items.length ? 'Finish diagnostic' : 'Next →'}
              </button>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
