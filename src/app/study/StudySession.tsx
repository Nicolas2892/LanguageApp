'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { HintPanel } from '@/components/exercises/HintPanel'
import { Badge } from '@/components/ui/badge'
import {
  PartyPopper, CheckCircle2, XCircle,
  Languages, Type, Shuffle, AlertTriangle, PenLine, ArrowLeftRight, Sparkles, Timer,
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

interface SprintConfig {
  limitType: 'time' | 'count'
  limit: number
}

interface Props {
  items: StudyItem[]
  practiceMode?: boolean
  generateConfig?: GenerateConfig
  returnHref?: string
  sprintConfig?: SprintConfig
}

type SessionState =
  | { phase: 'answering' }
  | { phase: 'feedback'; result: GradeResult & { next_review_in_days: number }; userAnswer: string }
  | { phase: 'done'; correct: number; total: number; elapsedSeconds?: number }

const EXERCISE_TYPE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  gap_fill:         { label: 'Gap fill',         Icon: Type          },
  translation:      { label: 'Translation',      Icon: Languages     },
  transformation:   { label: 'Transformation',   Icon: ArrowLeftRight },
  sentence_builder: { label: 'Sentence builder', Icon: Shuffle       },
  error_correction: { label: 'Error correction', Icon: AlertTriangle },
  free_write:       { label: 'Free write',       Icon: PenLine       },
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StudySession({ items: initialItems, practiceMode, generateConfig, returnHref, sprintConfig }: Props) {
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

  // Sprint: time mode countdown
  const totalSeconds = sprintConfig?.limitType === 'time' ? sprintConfig.limit * 60 : 0
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  // Countdown interval
  useEffect(() => {
    if (sprintConfig?.limitType !== 'time') return
    if (state.phase === 'done') return
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [sprintConfig, state.phase])

  // Timer expiry → done
  useEffect(() => {
    if (sprintConfig?.limitType !== 'time') return
    if (secondsLeft > 0) return
    if (state.phase === 'done') return
    const correct = scores.filter((s) => s >= 2).length
    setState({ phase: 'done', correct, total: scores.length, elapsedSeconds: totalSeconds })
    fetch('/api/sessions/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        started_at: startedAt.current,
        concepts_reviewed: scores.length,
        accuracy: scores.length > 0 ? Math.round((correct / scores.length) * 100) : 0,
      }),
    }).catch(() => {})
  }, [secondsLeft, sprintConfig, state.phase, scores, totalSeconds])

  // Effective length for count mode
  const effectiveLength = sprintConfig?.limitType === 'count'
    ? Math.min(dynamicItems.length, sprintConfig.limit)
    : dynamicItems.length

  const current = dynamicItems[index]

  // Progress bar values
  const progressPct = sprintConfig?.limitType === 'time'
    ? totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0
    : (index / effectiveLength) * 100

  const isTimeLow = sprintConfig?.limitType === 'time' && secondsLeft / totalSeconds < 0.1 && secondsLeft > 0

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
    if (index + 1 >= effectiveLength) {
      const correct = scores.filter((s) => s >= 2).length
      const elapsed = sprintConfig?.limitType === 'time' ? totalSeconds - secondsLeft : undefined
      setState({ phase: 'done', correct, total: index + 1, elapsedSeconds: elapsed })
      fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at: startedAt.current,
          concepts_reviewed: index + 1,
          accuracy: Math.round((correct / (index + 1)) * 100),
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
    const pct = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0
    const missed = state.total - state.correct
    const backLabel = returnHref ? 'Back to concept' : sprintConfig ? 'Back to Home' : 'Done'
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
        {sprintConfig?.limitType === 'time' && state.elapsedSeconds !== undefined && (
          <p className="text-muted-foreground text-sm">
            Reviewed {state.total} exercise{state.total !== 1 ? 's' : ''} in {formatTime(state.elapsedSeconds)}
          </p>
        )}
        {!practiceMode && !sprintConfig && (
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
  const isLast = index + 1 >= effectiveLength

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {sprintConfig?.limitType === 'time' ? (
            <span className={`font-mono font-semibold flex items-center gap-1 ${isTimeLow ? 'text-amber-500' : ''}`}>
              <Timer className="h-3.5 w-3.5" />
              {formatTime(secondsLeft)}
            </span>
          ) : (
            <span className="font-medium">{index + 1} / {effectiveLength}</span>
          )}
          <Badge variant="outline" className="capitalize text-xs">{current.concept.type} practice</Badge>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isTimeLow ? 'bg-amber-500 animate-pulse' : 'bg-primary'
            }`}
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
            isLast={isLast}
          />
        )}
      </div>
    </div>
  )
}
