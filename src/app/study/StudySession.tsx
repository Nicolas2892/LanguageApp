'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { HintPanel } from '@/components/exercises/HintPanel'
import { Badge } from '@/components/ui/badge'
import {
  PartyPopper, CheckCircle2, XCircle,
  Languages, Type, Shuffle, AlertTriangle, PenLine, ArrowLeftRight, Sparkles,
} from 'lucide-react'
import type { Concept, Exercise } from '@/lib/supabase/types'
import type { GradeResult } from '@/lib/claude/grader'

export interface StudyItem {
  concept: Concept
  exercise: Exercise
}

interface GenerateConfig {
  conceptId: string
  concept: Concept
  exerciseType: string
}

interface Props {
  items: StudyItem[]
  practiceMode?: boolean
  generateConfig?: GenerateConfig
  returnHref?: string
}

type SessionState =
  | { phase: 'answering' }
  | { phase: 'feedback'; result: GradeResult & { next_review_in_days: number }; userAnswer: string }
  | { phase: 'done'; correct: number; total: number }

const EXERCISE_TYPE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  gap_fill:         { label: 'Gap fill',         Icon: Type          },
  translation:      { label: 'Translation',      Icon: Languages     },
  transformation:   { label: 'Transformation',   Icon: ArrowLeftRight },
  sentence_builder: { label: 'Sentence builder', Icon: Shuffle       },
  error_correction: { label: 'Error correction', Icon: AlertTriangle },
  free_write:       { label: 'Free write',       Icon: PenLine       },
}

export function StudySession({ items: initialItems, practiceMode, generateConfig, returnHref }: Props) {
  const router = useRouter()
  const startedAt = useRef(new Date().toISOString())
  const [dynamicItems, setDynamicItems] = useState<StudyItem[]>(initialItems)
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<SessionState>({ phase: 'answering' })
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState<number[]>([])

  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [claudeHint, setClaudeHint] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  const [generatingMore, setGeneratingMore] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const current = dynamicItems[index]
  const progressPct = (index / dynamicItems.length) * 100

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
          ...(practiceMode && { skip_srs: true }),
        }),
      })
      const result = await res.json() as GradeResult & { next_review_in_days: number }
      setScores((s) => [...s, result.score])
      if (!result.is_correct) setWrongAttempts((n) => n + 1)
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
      // silently fail
    } finally {
      setLoadingHint(false)
    }
  }

  function handleTryAgain() {
    setState({ phase: 'answering' })
  }

  function handleNext() {
    if (index + 1 >= dynamicItems.length) {
      const correct = scores.filter((s) => s >= 2).length
      setState({ phase: 'done', correct, total: dynamicItems.length })
      fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at: startedAt.current,
          concepts_reviewed: dynamicItems.length,
          accuracy: Math.round((correct / dynamicItems.length) * 100),
        }),
      }).catch(() => {})
    } else {
      setIndex((i) => i + 1)
      setState({ phase: 'answering' })
      setWrongAttempts(0)
      setClaudeHint(null)
    }
  }

  async function handleGenerateMore() {
    if (!generateConfig) return
    setGeneratingMore(true)
    setGenerateError(null)
    try {
      const body = JSON.stringify({
        concept_id: generateConfig.conceptId,
        type: generateConfig.exerciseType,
      })
      const headers = { 'Content-Type': 'application/json' }
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/exercises/generate', { method: 'POST', headers, body }).then((r) => r.json()),
        fetch('/api/exercises/generate', { method: 'POST', headers, body }).then((r) => r.json()),
        fetch('/api/exercises/generate', { method: 'POST', headers, body }).then((r) => r.json()),
      ])
      const newItems: StudyItem[] = [r1, r2, r3].map((ex) => ({
        concept: generateConfig.concept,
        exercise: ex as Exercise,
      }))
      const startIndex = dynamicItems.length
      setDynamicItems((prev) => [...prev, ...newItems])
      setIndex(startIndex)
      setState({ phase: 'answering' })
      setWrongAttempts(0)
      setClaudeHint(null)
    } catch {
      setGenerateError('Failed to generate exercises. Please try again.')
    } finally {
      setGeneratingMore(false)
    }
  }

  // Done screen
  if (state.phase === 'done') {
    const pct = Math.round((state.correct / state.total) * 100)
    const missed = state.total - state.correct
    const backLabel = returnHref ? 'Back to concept' : 'Done'
    return (
      <div className="space-y-6 text-center py-8">
        <PartyPopper className="h-14 w-14 text-orange-500 mx-auto" />
        <div>
          <p className="text-5xl font-extrabold">{pct}%</p>
          <p className="text-muted-foreground mt-1 text-sm">Session complete</p>
        </div>
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">{state.correct} correct</span>
          </div>
          {missed > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">{missed} to review</span>
            </div>
          )}
        </div>
        {!practiceMode && (
          <p className="text-muted-foreground text-sm">
            The SRS has scheduled your next reviews based on your performance.
          </p>
        )}
        <div className="flex flex-col items-center gap-3">
          {practiceMode && generateConfig && (
            <button
              onClick={handleGenerateMore}
              disabled={generatingMore}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary text-primary px-6 py-2.5 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-transform disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {generatingMore ? 'Generating…' : 'Generate 3 more'}
            </button>
          )}
          <button
            onClick={() => router.push(returnHref ?? '/dashboard')}
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-transform"
          >
            {backLabel}
          </button>
          {generateError && (
            <p className="text-sm text-red-600">{generateError}</p>
          )}
        </div>
      </div>
    )
  }

  const typeMeta = EXERCISE_TYPE_META[current.exercise.type] ?? { label: current.exercise.type, Icon: Type }
  const TypeIcon = typeMeta.Icon

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{index + 1} / {dynamicItems.length}</span>
          <Badge variant="outline" className="capitalize text-xs">{current.concept.type} practice</Badge>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Concept title + exercise type badge */}
      <div className="space-y-2">
        <p className="text-xl font-bold tracking-tight">{current.concept.title}</p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          <TypeIcon className="h-3.5 w-3.5" />
          {typeMeta.label}
        </span>
      </div>

      {/* Concept explanation */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Concept</p>
        <p>{current.concept.explanation}</p>
      </div>

      {/* Exercise */}
      <div className="space-y-3">
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
            isLast={index + 1 >= dynamicItems.length}
          />
        )}
      </div>
    </div>
  )
}
