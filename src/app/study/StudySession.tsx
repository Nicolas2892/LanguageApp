'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { HintPanel } from '@/components/exercises/HintPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  PartyPopper, CheckCircle2, XCircle,
  Languages, Type, Shuffle, AlertTriangle, PenLine, ArrowLeftRight, Sparkles, Timer, X, Loader2,
} from 'lucide-react'
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt'
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
  freeWriteConceptId?: string
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

export function StudySession({ items: initialItems, practiceMode, generateConfig, returnHref, sprintConfig, freeWriteConceptId }: Props) {
  const router = useRouter()
  const startedAt = useRef(new Date().toISOString())
  const [dynamicItems, setDynamicItems] = useState<StudyItem[]>(initialItems)
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<SessionState>({ phase: 'answering' })
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [missedConcepts, setMissedConcepts] = useState<Array<{ id: string; title: string }>>([])
  const [showExitDialog, setShowExitDialog] = useState(false)

  const [, startTransition] = useTransition()
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [claudeHint, setClaudeHint] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [generatingMore, setGeneratingMore] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [flashClass, setFlashClass] = useState<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confettiFired = useRef(false)
  const autoGenerateTriggeredRef = useRef(false)

  // UX-Z: per-exercise timing for "~N min remaining"
  const exerciseStartRef = useRef<number>(Date.now())
  const [submissionTimes, setSubmissionTimes] = useState<number[]>([])

  // UX-AB: concept explanation collapsed by default
  const [isConceptExpanded, setIsConceptExpanded] = useState(false)

  // UX-AA: mastery milestone overlay
  const [masteryOverlayOpen, setMasteryOverlayOpen] = useState(false)
  const [masteredConceptTitle, setMasteredConceptTitle] = useState<string | null>(null)
  const masteredConceptIdsThisSession = useRef<Set<string>>(new Set())

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

  // Cleanup flash timer on unmount
  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current) }
  }, [])

  // Confetti on done screen (≥70% accuracy)
  useEffect(() => {
    if (state.phase !== 'done') return
    const pct = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0
    if (pct >= 70 && !confettiFired.current) {
      confettiFired.current = true
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      }).catch(() => {})
    }
  }, [state])

  // Prefetch next route while user reads their score
  useEffect(() => {
    if (state.phase !== 'done') return
    router.prefetch(returnHref ?? '/study')
  }, [state.phase, router, returnHref])

  // UX-AA: auto-dismiss mastery overlay after 4s
  useEffect(() => {
    if (!masteryOverlayOpen) return
    const id = setTimeout(() => setMasteryOverlayOpen(false), 4000)
    return () => clearTimeout(id)
  }, [masteryOverlayOpen])

  // Auto-generate drill exercises during feedback on last loaded exercise
  useEffect(() => {
    if (state.phase !== 'feedback') return
    if (!practiceMode || !generateConfig) return
    if (index + 1 < dynamicItems.length) return  // more items already available
    if (generatingMore || autoGenerateTriggeredRef.current) return

    autoGenerateTriggeredRef.current = true
    setGeneratingMore(true)
    setGenerateError(null)

    const body = JSON.stringify({ concept_id: generateConfig.conceptId, type: generateConfig.exerciseType })
    const headers = { 'Content-Type': 'application/json' }

    Promise.all([
      fetch('/api/exercises/generate', { method: 'POST', headers, body }).then((r) => r.json()),
      fetch('/api/exercises/generate', { method: 'POST', headers, body }).then((r) => r.json()),
      fetch('/api/exercises/generate', { method: 'POST', headers, body }).then((r) => r.json()),
    ]).then(([r1, r2, r3]) => {
      const exercises = [r1, r2, r3].filter((ex) => ex && typeof ex.id === 'string')
      if (exercises.length === 0) {
        setGenerateError('Failed to generate exercises. Please try again.')
        return
      }
      setDynamicItems((prev) => [
        ...prev,
        ...exercises.map((ex) => ({ concept: generateConfig.concept, exercise: ex as Exercise })),
      ])
    }).catch(() => {
      setGenerateError('Failed to generate exercises. Please try again.')
    }).finally(() => {
      setGeneratingMore(false)
    })
  }, [state.phase, index, practiceMode, generateConfig, dynamicItems.length, generatingMore])

  // Enter/Space to advance after feedback (UX-X)
  useEffect(() => {
    if (state.phase !== 'feedback') return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.phase, handleNext])

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

  // UX-Z: estimated minutes remaining
  const avgSeconds = submissionTimes.length > 0
    ? submissionTimes.reduce((a, b) => a + b, 0) / submissionTimes.length
    : 30
  const remainingCount = effectiveLength - (index + 1)
  const estimatedMinutes = !sprintConfig && remainingCount > 1
    ? Math.max(1, Math.round((remainingCount * avgSeconds) / 60))
    : null

  // Progress bar values
  const progressPct = sprintConfig?.limitType === 'time'
    ? totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0
    : (index / effectiveLength) * 100

  const isTimeLow = sprintConfig?.limitType === 'time' && secondsLeft / totalSeconds < 0.1 && secondsLeft > 0

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
          ...(practiceMode && { skip_srs: true }),
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setSubmitError('Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      const gradeResult = result as GradeResult & {
        next_review_in_days: number
        just_mastered: boolean
        mastered_concept_title: string | null
      }
      setScores((s) => [...s, gradeResult.score])

      // Track missed concepts (score < 2)
      if (gradeResult.score < 2) {
        setMissedConcepts((prev) => {
          if (prev.some((c) => c.id === current.concept.id)) return prev
          return [...prev, { id: current.concept.id, title: current.concept.title }]
        })
      }

      // UX-AA: show mastery milestone overlay (once per concept per session)
      if (
        gradeResult.just_mastered &&
        gradeResult.mastered_concept_title &&
        !masteredConceptIdsThisSession.current.has(current.concept.id)
      ) {
        masteredConceptIdsThisSession.current.add(current.concept.id)
        setMasteredConceptTitle(gradeResult.mastered_concept_title)
        setMasteryOverlayOpen(true)
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 }, scalar: 0.8 })
        }).catch(() => {})
      }

      // UX-Z: record time taken for this exercise
      const elapsedSec = Math.max(1, Math.round((Date.now() - exerciseStartRef.current) / 1000))
      setSubmissionTimes((prev) => [...prev, elapsedSec])

      if (!gradeResult.is_correct) setWrongAttempts((n) => n + 1)
      const fc = gradeResult.score >= 2 ? 'animate-flash-green' : 'animate-flash-red'
      setFlashClass(fc)
      setSubmitting(false)
      flashTimerRef.current = setTimeout(() => {
        setState({ phase: 'feedback', result: gradeResult, userAnswer: answer })
        setFlashClass(null)
      }, 300)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
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
      // UX-AB: collapse concept note on each new exercise
      setIsConceptExpanded(false)
      // UX-Z: reset exercise start time
      exerciseStartRef.current = Date.now()
      startTransition(() => {
        autoGenerateTriggeredRef.current = false
        setIndex((i) => i + 1)
        setState({ phase: 'answering' })
        setWrongAttempts(0)
        setClaudeHint(null)
      })
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
      const exercises = [r1, r2, r3].filter(
        (ex) => ex && typeof ex.id === 'string'
      )
      if (exercises.length === 0) {
        setGenerateError('Failed to generate exercises. Please try again.')
        return
      }
      const newItems: StudyItem[] = exercises.map((ex) => ({
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
    const sessionLabel = pct >= 90
      ? "That's as clean as it gets."
      : pct >= 70
      ? "Solid work — the gaps are already queued for next time."
      : pct >= 50
      ? "The tough ones are the ones worth repeating."
      : "Rough session — that's exactly what review is for."
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className={pct < 70 ? 'rounded-full ring-2 ring-orange-400 ring-offset-2 animate-pulse p-2' : ''}>
            <PartyPopper className="h-14 w-14 text-orange-500 animate-in zoom-in-50 duration-500" strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <p className="text-5xl font-extrabold">{pct}%</p>
          <p className="text-muted-foreground mt-1 text-sm">{sessionLabel}</p>
        </div>
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">{state.correct} correct</span>
          </div>
          {missed > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-orange-500" strokeWidth={1.5} />
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
            Your next sessions are already lined up — the hard work is remembering when it counts.
          </p>
        )}

        {/* Missed concepts breakdown */}
        {missedConcepts.length > 0 && (
          <details className="w-full text-left border rounded-xl p-3 mt-2">
            <summary className="text-sm font-semibold cursor-pointer">
              {missedConcepts.length} concept{missedConcepts.length !== 1 ? 's' : ''} to revisit
            </summary>
            <ul className="mt-2 space-y-1.5">
              {missedConcepts.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/study?concept=${c.id}`}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    Practice: {c.title} →
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        <PushPermissionPrompt />

        <div className="flex flex-col items-center gap-3">
          {freeWriteConceptId && (
            <button
              onClick={() => router.push(`/write?suggested=${freeWriteConceptId}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border text-muted-foreground px-6 py-2.5 text-sm font-medium hover:bg-muted/50 active:scale-95 transition-transform"
            >
              <PenLine className="h-4 w-4" strokeWidth={1.5} />
              Free write about this topic
            </button>
          )}
          {practiceMode && generateConfig && (
            <button
              onClick={handleGenerateMore}
              disabled={generatingMore}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary text-primary px-6 py-2.5 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-transform disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
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
            <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>
          )}
        </div>
      </div>
    )
  }

  const typeMeta = EXERCISE_TYPE_META[current.exercise.type] ?? { label: current.exercise.type, Icon: Type }
  const TypeIcon = typeMeta.Icon
  const isLast = index + 1 >= effectiveLength

  return (
    <>
      {/* UX-AA: Mastery milestone overlay */}
      <Dialog open={masteryOverlayOpen} onOpenChange={setMasteryOverlayOpen}>
        <DialogContent className="text-center max-w-sm">
          <DialogHeader className="items-center gap-3">
            <div className="text-4xl">🏆</div>
            <DialogTitle className="text-xl">Concept mastered!</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            You&apos;ve mastered{' '}
            <span className="font-semibold text-foreground">{masteredConceptTitle}</span>.
            It&apos;s now in your long-term memory.
          </p>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setMasteryOverlayOpen(false)} className="w-full sm:w-auto">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your progress this session won&apos;t be saved.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Keep going
            </Button>
            <Button variant="destructive" onClick={() => router.push(returnHref ?? '/dashboard')}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-5">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {sprintConfig?.limitType === 'time' ? (
              <span className={`font-mono font-semibold flex items-center gap-1 ${isTimeLow ? 'text-amber-500 dark:text-amber-400' : ''}`}>
                <Timer className="h-3.5 w-3.5" />
                {formatTime(secondsLeft)}
              </span>
            ) : (
              <span className="font-medium">
              {index + 1} / {effectiveLength}
              {estimatedMinutes !== null && (
                <span className="text-muted-foreground font-normal ml-1.5">
                  · ~{estimatedMinutes} min
                </span>
              )}
            </span>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize text-xs">{current.concept.type} practice</Badge>
              <button
                onClick={() => setShowExitDialog(true)}
                aria-label="Exit session"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
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

        {/* Concept explanation — collapsed by default */}
        <div className="bg-muted/50 rounded-lg text-sm overflow-hidden">
          <button
            onClick={() => setIsConceptExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            aria-expanded={isConceptExpanded}
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {isConceptExpanded ? 'Concept Notes ↑' : 'Concept Notes ↓'}
            </span>
          </button>
          <div
            className="transition-[max-height] duration-200 ease-in-out overflow-hidden"
            style={{ maxHeight: isConceptExpanded ? '16rem' : '0' }}
          >
            <div className="px-4 pb-4">
              <p>{current.concept.explanation}</p>
            </div>
          </div>
        </div>

        {/* Exercise */}
        <div key={index} className={`space-y-3 rounded-xl transition-colors duration-300 animate-exercise-in ${flashClass ?? ''}`}>
          {(state.phase === 'answering' || flashClass) && (
            <div className="animate-in slide-in-from-right-2 duration-200">
              <ExerciseRenderer exercise={current.exercise} onSubmit={handleSubmit} disabled={submitting} />
              {submitting && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking…</span>
                </div>
              )}
              {submitError && (
                <p className="text-sm text-destructive mt-2">{submitError}</p>
              )}
              <HintPanel
                hint1={current.exercise.hint_1}
                hint2={current.exercise.hint_2}
                claudeHint={claudeHint}
                wrongAttempts={wrongAttempts}
                loadingHint={loadingHint}
                onRequestHint={handleRequestClaudeHint}
              />
            </div>
          )}

          {state.phase === 'feedback' && (
            <div className="animate-in slide-in-from-bottom-3 duration-200">
              <FeedbackPanel
                result={state.result}
                userAnswer={state.userAnswer}
                onNext={handleNext}
                onTryAgain={!state.result.is_correct ? handleTryAgain : undefined}
                isLast={isLast}
                isGenerating={generatingMore}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
