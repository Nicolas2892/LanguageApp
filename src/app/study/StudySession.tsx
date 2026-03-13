'use client'

import { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { HintPanel } from '@/components/exercises/HintPanel'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
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
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { useHaptics } from '@/lib/hooks/useHaptics'
import type { Concept, Exercise } from '@/lib/supabase/types'
import type { GradeResult } from '@/lib/claude/grader'
import { trackExerciseSubmitted, trackSessionCompleted } from '@/lib/analytics'

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
  sessionLabel?: string
}

type SessionState =
  | { phase: 'answering' }
  | { phase: 'feedback'; result: GradeResult & { next_review_in_days: number }; userAnswer: string }
  | { phase: 'done'; correct: number; total: number; elapsedSeconds?: number }

const EXERCISE_TYPE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  gap_fill:         { label: 'Completar Hueco',         Icon: Type          },
  translation:      { label: 'Traducción',              Icon: Languages     },
  transformation:   { label: 'Transformación',          Icon: ArrowLeftRight },
  sentence_builder: { label: 'Constructor De Frases',   Icon: Shuffle       },
  error_correction: { label: 'Corrección De Errores',   Icon: AlertTriangle },
  free_write:       { label: 'Escritura Libre',         Icon: PenLine       },
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StudySession({ items: initialItems, practiceMode, generateConfig, returnHref, sprintConfig, freeWriteConceptId, sessionLabel }: Props) {
  const router = useRouter()
  const { triggerSuccess, triggerError } = useHaptics()
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
  const [streamingDetails, setStreamingDetails] = useState(false)
  const [flashClass, setFlashClass] = useState<string | null>(null)
  const [exiting, setExiting] = useState(false)
  const submittingRef = useRef(false)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Holds details chunk that arrived before the 300ms flash timer fires
  const pendingDetailsRef = useRef<{ feedback: string; corrected_version: string; explanation: string } | null>(null)
  const confettiFired = useRef(false)
  const autoGenerateTriggeredRef = useRef(false)

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
      }).catch((err) => console.warn('confetti load failed', err))
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
      const existingIds = new Set(dynamicItems.map(item => item.exercise.id))
      const exercises = [r1, r2, r3].filter((ex) => ex && typeof ex.id === 'string' && !existingIds.has(ex.id))
      if (exercises.length === 0) {
        setGenerateError('No hay más ejercicios únicos disponibles.')
        return
      }
      setDynamicItems((prev) => [
        ...prev,
        ...exercises.map((ex) => ({ concept: generateConfig.concept, exercise: ex as Exercise })),
      ])
    }).catch(() => {
      setGenerateError('Error al generar ejercicios. Inténtalo de nuevo.')
    }).finally(() => {
      setGeneratingMore(false)
    })
  }, [state.phase, index, practiceMode, generateConfig, dynamicItems.length, generatingMore])

  // Effective length for count mode (must be above handleNext)
  const effectiveLength = sprintConfig?.limitType === 'count'
    ? Math.min(dynamicItems.length, sprintConfig.limit)
    : dynamicItems.length

  const current = dynamicItems[index]

  function handleTryAgain() {
    setState({ phase: 'answering' })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleNext = useCallback(function handleNext() {
    if (index + 1 >= effectiveLength) {
      const correct = scores.filter((s) => s >= 2).length
      const elapsed = sprintConfig?.limitType === 'time' ? totalSeconds - secondsLeft : undefined
      setState({ phase: 'done', correct, total: index + 1, elapsedSeconds: elapsed })
      trackSessionCompleted({ correct, total: index + 1, practiceMode: !!practiceMode, elapsedSeconds: elapsed })
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
      // Exit animation before advancing
      setExiting(true)
      setTimeout(() => {
        setExiting(false)
        // UX-AB: collapse concept note on each new exercise
        setIsConceptExpanded(false)
        startTransition(() => {
          autoGenerateTriggeredRef.current = false
          setIndex((i) => i + 1)
          setState({ phase: 'answering' })
          setWrongAttempts(0)
          setClaudeHint(null)
        })
      }, 150)
    }
  }, [index, effectiveLength, scores, sprintConfig, totalSeconds, secondsLeft, practiceMode])

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
    trackSessionCompleted({ correct, total: scores.length, practiceMode: !!practiceMode, elapsedSeconds: totalSeconds })
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

  // Progress bar values
  const progressPct = sprintConfig?.limitType === 'time'
    ? totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0
    : (index / effectiveLength) * 100

  const isTimeLow = sprintConfig?.limitType === 'time' && secondsLeft / totalSeconds < 0.1 && secondsLeft > 0

  async function handleSubmit(answer: string) {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: current!.exercise.id,
          concept_id: current!.concept.id,
          user_answer: answer,
          ...(practiceMode && { skip_srs: true }),
        }),
      })

      if (res.status === 401) {
        router.push('/auth/login?returnUrl=/study')
        return
      }

      if (!res.ok || !res.body) {
        setSubmitError('Algo salió mal. Inténtalo de nuevo.')
        setSubmitting(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let scoreChunk: {
        score: number
        is_correct: boolean
        next_review_in_days: number
        just_mastered: boolean
        mastered_concept_title: string | null
      } | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          let parsed: Record<string, unknown>
          try {
            parsed = JSON.parse(line) as Record<string, unknown>
          } catch {
            console.warn('Malformed NDJSON line, skipping:', line)
            continue
          }

          if ('score' in parsed && !scoreChunk) {
            // Chunk 1: score + SRS data
            scoreChunk = parsed as unknown as typeof scoreChunk

            setScores((s) => [...s, parsed.score as number])

            trackExerciseSubmitted({
              exerciseType: current!.exercise.type,
              conceptId: current!.concept.id,
              score: parsed.score as number,
              isCorrect: parsed.is_correct as boolean,
              practiceMode: !!practiceMode,
            })

            // Track missed concepts (score < 2)
            if ((parsed.score as number) < 2) {
              setMissedConcepts((prev) => {
                if (prev.some((c) => c.id === current!.concept.id)) return prev
                return [...prev, { id: current!.concept.id, title: current!.concept.title }]
              })
            }

            // UX-AA: show mastery milestone overlay (once per concept per session)
            if (
              parsed.just_mastered &&
              parsed.mastered_concept_title &&
              !masteredConceptIdsThisSession.current.has(current!.concept.id)
            ) {
              masteredConceptIdsThisSession.current.add(current!.concept.id)
              setMasteredConceptTitle(parsed.mastered_concept_title as string)
              setMasteryOverlayOpen(true)
              import('canvas-confetti').then(({ default: confetti }) => {
                confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 }, scalar: 0.8 })
              }).catch((err) => console.warn('confetti load failed', err))
            }

            if (!parsed.is_correct) setWrongAttempts((n) => n + 1)
            const isGood = (parsed.score as number) >= 2
            if (isGood) triggerSuccess(); else triggerError()
            const fc = isGood ? 'animate-flash-green' : 'animate-flash-red'
            setFlashClass(fc)
            setSubmitting(false)
            setStreamingDetails(true)
            pendingDetailsRef.current = null

            const initialResult = {
              score: parsed.score as GradeResult['score'],
              is_correct: parsed.is_correct as boolean,
              next_review_in_days: parsed.next_review_in_days as number,
              just_mastered: parsed.just_mastered as boolean,
              mastered_concept_title: parsed.mastered_concept_title as string | null,
              feedback: '',
              corrected_version: '',
              explanation: '',
            }

            flashTimerRef.current = setTimeout(() => {
              const details = pendingDetailsRef.current
              setState({
                phase: 'feedback',
                result: details ? { ...initialResult, ...details } : initialResult,
                userAnswer: answer,
              })
              setFlashClass(null)
              if (details) {
                setStreamingDetails(false)
                pendingDetailsRef.current = null
              }
            }, 300)
          } else if ('feedback' in parsed && scoreChunk) {
            // Chunk 2: feedback details — may arrive before or after the flash timer fires
            const details = {
              feedback: parsed.feedback as string,
              corrected_version: parsed.corrected_version as string,
              explanation: parsed.explanation as string,
            }
            pendingDetailsRef.current = details
            setState((prev) =>
              prev.phase === 'feedback'
                ? { ...prev, result: { ...prev.result, ...details } }
                : prev,
            )
            setStreamingDetails(false)
          }
        }
      }
    } catch {
      setSubmitError('Algo salió mal. Inténtalo de nuevo.')
      setSubmitting(false)
    } finally {
      submittingRef.current = false
    }
  }

  async function handleRequestClaudeHint() {
    setLoadingHint(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: current!.exercise.id,
          concept_id: current!.concept.id,
        }),
      })
      if (!res.ok) throw new Error(`Hint request failed: ${res.status}`)
      const { hint } = await res.json() as { hint: string }
      setClaudeHint(hint)
    } catch {
      setSubmitError('No se pudo cargar la pista. Inténtalo de nuevo.')
    } finally {
      setLoadingHint(false)
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
      const existingIds = new Set(dynamicItems.map(item => item.exercise.id))
      const exercises = [r1, r2, r3].filter(
        (ex) => ex && typeof ex.id === 'string' && !existingIds.has(ex.id)
      )
      if (exercises.length === 0) {
        setGenerateError('No hay más ejercicios únicos disponibles.')
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
      setGenerateError('Error al generar ejercicios. Inténtalo de nuevo.')
    } finally {
      setGeneratingMore(false)
    }
  }

  // E3: Null guard — empty items or out-of-bounds index
  if (!current && state.phase !== 'done') {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">No hay ejercicios disponibles.</p>
        <Button onClick={() => router.push(returnHref ?? '/dashboard')} variant="outline">
          ← Volver
        </Button>
      </div>
    )
  }

  // Done screen
  if (state.phase === 'done') {
    const pct = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0
    const missed = state.total - state.correct
    const backLabel = returnHref ? 'Volver al concepto' : sprintConfig ? 'Volver al inicio' : 'Hecho'
    const sessionLabel = pct >= 90
      ? 'Impecable.'
      : pct >= 70
      ? 'Buen trabajo — los huecos ya están en cola.'
      : pct >= 50
      ? 'Las difíciles son las que vale la pena repetir.'
      : 'Sesión difícil — para eso es el repaso.'
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
            <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-medium text-primary">{state.correct} correctas</span>
          </div>
          {missed > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-[var(--d5-warm)]" strokeWidth={1.5} />
              <span className="text-sm font-medium text-[var(--d5-warm)]">{missed} por repasar</span>
            </div>
          )}
        </div>
        {sprintConfig?.limitType === 'time' && state.elapsedSeconds !== undefined && (
          <p className="text-muted-foreground text-sm">
            {state.total} ejercicio{state.total !== 1 ? 's' : ''} en {formatTime(state.elapsedSeconds)}
          </p>
        )}
        {!practiceMode && !sprintConfig && (
          <p className="text-muted-foreground text-sm">
            Tus próximas sesiones ya están programadas — lo difícil es recordar cuando importa.
          </p>
        )}

        {/* Missed concepts breakdown */}
        {missedConcepts.length > 0 && (
          <details className="w-full text-left border rounded-xl p-3 mt-2">
            <summary className="text-sm font-semibold cursor-pointer">
              {missedConcepts.length} concepto{missedConcepts.length !== 1 ? 's' : ''} por repasar
            </summary>
            <ul className="mt-2 space-y-1.5">
              {missedConcepts.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/study?practice=true&concept=${c.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Practicar: {c.title} →
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
              Escritura libre sobre este tema
            </button>
          )}
          {practiceMode && generateConfig && (
            <button
              onClick={handleGenerateMore}
              disabled={generatingMore}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary text-primary px-6 py-2.5 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-transform disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              {generatingMore ? 'Generando…' : 'Generar 3 más'}
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

  // current is guaranteed non-null here — early returns above handle undefined + done
  const item = current!
  const typeMeta = EXERCISE_TYPE_META[item.exercise.type] ?? { label: item.exercise.type, Icon: Type }
  const TypeIcon = typeMeta.Icon
  const isLast = index + 1 >= effectiveLength

  return (
    <div className="relative overflow-hidden">
      <BackgroundMagicS opacity={0.05} />

      {/* UX-AA: Mastery milestone overlay */}
      <Dialog open={masteryOverlayOpen} onOpenChange={setMasteryOverlayOpen}>
        <DialogContent className="text-center max-w-sm">
          <DialogHeader className="items-center gap-3">
            <div className="text-4xl">🏆</div>
            <DialogTitle className="text-xl">¡Concepto dominado!</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Has dominado{' '}
            <span className="font-semibold text-foreground">{masteredConceptTitle}</span>.
            Ya está en tu memoria a largo plazo.
          </p>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setMasteryOverlayOpen(false)} className="w-full sm:w-auto">
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir de la Sesión?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tu progreso de esta sesión no se guardará.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Seguir
            </Button>
            <Button variant="destructive" onClick={() => router.push(returnHref ?? '/dashboard')}>
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Row 1: segmented progress dots + X exit button */}
        <div className="flex items-center gap-2">
          {sprintConfig?.limitType === 'time' ? (
            /* Sprint time mode: continuous bar (segments don't map to time) */
            <div className="flex-1 h-1 bg-[var(--d5-muted)]/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isTimeLow ? 'bg-amber-500 animate-pulse' : 'bg-primary'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : (
            /* Count mode: segmented dots */
            <div className="flex flex-1 gap-1">
              {Array.from({ length: effectiveLength }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= index ? 'bg-primary' : 'bg-[var(--d5-muted)]/30'
                  }`}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => setShowExitDialog(true)}
            aria-label="Salir de la sesión"
            className="text-[var(--d5-muted)] hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Row 2: type eyebrow · concept · counter/timer · Notes toggle */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="senda-eyebrow" style={{ color: 'var(--d5-terracotta)' }}>{typeMeta.label}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
          <span className="text-[var(--d5-warm)]">{item.concept.title}</span>
          {item.concept.grammar_focus && (
            <>
              <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
              <GrammarFocusChip focus={item.concept.grammar_focus} />
            </>
          )}
          <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
          {sprintConfig?.limitType === 'time' ? (
            <span className={`font-mono font-semibold flex items-center gap-0.5 ${isTimeLow ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--d5-muted)]'}`}>
              <Timer className="h-3 w-3" />
              {formatTime(secondsLeft)}
            </span>
          ) : (
            <span className="text-[var(--d5-muted)]">{index + 1}/{effectiveLength}</span>
          )}
          <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
          <button
            onClick={() => setIsConceptExpanded((e) => !e)}
            aria-expanded={isConceptExpanded}
            className="text-[var(--d5-muted)] hover:text-foreground transition-colors"
          >
            Notas {isConceptExpanded ? '↑' : '↓'}
          </button>
        </div>

        {/* Concept notes panel — inline below metadata row */}
        <div
          className="transition-[max-height] duration-200 ease-in-out overflow-hidden"
          style={{ maxHeight: isConceptExpanded ? '16rem' : '0' }}
        >
          <div className="bg-muted/50 rounded-lg text-sm px-4 py-3 max-w-prose">
            <p>{item.concept.explanation}</p>
          </div>
        </div>

        {/* Exercise */}
        <div key={index} className={`space-y-3 rounded-xl transition-colors duration-300 ${exiting ? 'animate-exercise-out' : 'animate-exercise-in'} ${flashClass ?? ''}`}>
          {(state.phase === 'answering' || flashClass) && (
            <div className="animate-in slide-in-from-right-2 duration-200">
              <ExerciseRenderer exercise={item.exercise} onSubmit={handleSubmit} disabled={submitting} />
              {submitting && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Comprobando…</span>
                </div>
              )}
              {submitError && (
                <p className="text-sm text-destructive mt-2">{submitError}</p>
              )}
              {wrongAttempts > 0 && (
                <div className="animate-in fade-in duration-300">
                  <HintPanel
                    hint1={item.exercise.hint_1}
                    hint2={item.exercise.hint_2}
                    claudeHint={claudeHint}
                    wrongAttempts={wrongAttempts}
                    loadingHint={loadingHint}
                    onRequestHint={handleRequestClaudeHint}
                  />
                </div>
              )}
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
                isGenerating={generatingMore || streamingDetails}
                conceptId={item.concept.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
