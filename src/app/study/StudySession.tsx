'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { GapFill } from '@/components/exercises/GapFill'
import { TextAnswer } from '@/components/exercises/TextAnswer'
import { SentenceBuilder } from '@/components/exercises/SentenceBuilder'
import { ErrorCorrection } from '@/components/exercises/ErrorCorrection'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { HintPanel } from '@/components/exercises/HintPanel'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Concept, Exercise } from '@/lib/supabase/types'
import type { GradeResult } from '@/lib/claude/grader'

export interface StudyItem {
  concept: Concept
  exercise: Exercise
}

interface Props {
  items: StudyItem[]
}

type SessionState =
  | { phase: 'answering' }
  | { phase: 'feedback'; result: GradeResult & { next_review_in_days: number }; userAnswer: string }
  | { phase: 'done'; correct: number; total: number }

function ExerciseRenderer({ exercise, onSubmit, disabled }: {
  exercise: Exercise
  onSubmit: (answer: string) => void
  disabled: boolean
}) {
  switch (exercise.type) {
    case 'gap_fill':
      return <GapFill exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    case 'sentence_builder':
      return <SentenceBuilder exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    case 'error_correction':
      return <ErrorCorrection exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
    default:
      // transformation, translation, free_write
      return <TextAnswer exercise={exercise} onSubmit={onSubmit} disabled={disabled} />
  }
}

export function StudySession({ items }: Props) {
  const router = useRouter()
  const startedAt = useRef(new Date().toISOString())
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<SessionState>({ phase: 'answering' })
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState<number[]>([])

  // Hint state — resets on each new exercise
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [claudeHint, setClaudeHint] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  const current = items[index]
  const progress = (index / items.length) * 100

  async function handleSubmit(answer: string) {
    setSubmitting(true)
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
      setScores((s) => [...s, result.score])

      if (!result.is_correct) {
        setWrongAttempts((n) => n + 1)
      }

      setState({ phase: 'feedback', result, userAnswer: answer })
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestClaudeHint() {
    setLoadingHint(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: current.exercise.id,
          concept_id: current.concept.id,
        }),
      })
      const { hint } = await res.json() as { hint: string }
      setClaudeHint(hint)
    } catch {
      // silently fail — hint is optional
    } finally {
      setLoadingHint(false)
    }
  }

  function handleTryAgain() {
    setState({ phase: 'answering' })
  }

  function handleNext() {
    if (index + 1 >= items.length) {
      const correct = scores.filter((s) => s >= 2).length
      setState({ phase: 'done', correct, total: items.length })
      // Best-effort — record the session
      fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at: startedAt.current,
          concepts_reviewed: items.length,
          accuracy: Math.round((correct / items.length) * 100),
        }),
      }).catch(() => {})
    } else {
      setIndex((i) => i + 1)
      setState({ phase: 'answering' })
      setWrongAttempts(0)
      setClaudeHint(null)
    }
  }

  // Done screen
  if (state.phase === 'done') {
    const pct = Math.round((state.correct / state.total) * 100)
    return (
      <div className="space-y-6 text-center">
        <div className="text-5xl font-bold">{pct}%</div>
        <p className="text-xl text-muted-foreground">
          {state.correct} of {state.total} exercises correct
        </p>
        <p className="text-muted-foreground text-sm">
          The SRS has scheduled your next reviews based on your performance.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{index + 1} / {items.length}</span>
          <Badge variant="outline">{current.concept.title}</Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Concept context */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Concept</p>
        <p>{current.concept.explanation}</p>
      </div>

      {/* Exercise */}
      <div className="space-y-3">
        <Badge variant="secondary" className="text-xs capitalize">
          {current.exercise.type.replace('_', ' ')}
        </Badge>

        {state.phase === 'answering' && (
          <>
            <ExerciseRenderer exercise={current.exercise} onSubmit={handleSubmit} disabled={submitting} />
            {submitting && (
              <p className="text-sm text-muted-foreground animate-pulse">Grading with AI…</p>
            )}
            <HintPanel
              hint1={current.exercise.hint_1}
              hint2={current.exercise.hint_2}
              claudeHint={claudeHint}
              wrongAttempts={wrongAttempts}
              loadingHint={loadingHint}
              onRequestHint={handleRequestClaudeHint}
            />
          </>
        )}

        {state.phase === 'feedback' && (
          <FeedbackPanel
            result={state.result}
            userAnswer={state.userAnswer}
            onNext={handleNext}
            onTryAgain={!state.result.is_correct ? handleTryAgain : undefined}
            isLast={index + 1 >= items.length}
          />
        )}
      </div>
    </div>
  )
}
