'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { gradeConjugation } from '@/lib/verbs/grader'
import type { VerbGradeResult } from '@/lib/verbs/grader'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import type { VerbTense } from '@/lib/verbs/constants'
import { VerbFeedbackPanel } from '@/components/verbs/VerbFeedbackPanel'
import { VerbSummary } from '@/components/verbs/VerbSummary'
import { useHaptics } from '@/lib/hooks/useHaptics'
import { trackVerbDrillStarted, trackVerbDrillCompleted } from '@/lib/analytics'

const PRONOUN_LABELS: Record<string, string> = {
  yo:       'yo',
  tu:       'tú',
  el:       'él/ella',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos:    'ellos/ellas',
}

export interface SessionItem {
  verbId:      string
  infinitive:  string
  tense:       string
  pronoun:     string
  sentence:    string   // contains '_____'
  correctForm: string
  tenseRule:   string
}

interface TenseStat {
  tense: string
  correct: number
  total: number
}

type Phase =
  | { kind: 'answering' }
  | { kind: 'feedback'; result: VerbGradeResult }
  | { kind: 'done' }

interface Props {
  items: SessionItem[]
  showHint: boolean
  sessionUrl: string  // for "Practice Again" to restart with same config
}

export function VerbSession({ items, showHint, sessionUrl }: Props) {
  const router = useRouter()
  const { triggerSuccess, triggerError, triggerWarning } = useHaptics()
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' })
  const [flashClass, setFlashClass] = useState('')
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Track correct/total per tense
  const [scores, setScores] = useState<Map<number, boolean>>(new Map())
  const attemptRecordedRef = useRef(new Set<number>())
  const inputRef = useRef<HTMLInputElement>(null)

  const current = items[index]
  const isLast = index === items.length - 1

  // Build tense stats for summary
  function buildTenseStats(): TenseStat[] {
    const map = new Map<string, { correct: number; total: number }>()
    scores.forEach((isCorrect, idx) => {
      const item = items[idx]
      if (!item) return
      const entry = map.get(item.tense) ?? { correct: 0, total: 0 }
      entry.total++
      if (isCorrect) entry.correct++
      map.set(item.tense, entry)
    })
    return Array.from(map.entries()).map(([tense, s]) => ({ tense, ...s }))
  }

  // Track drill start on mount
  useEffect(() => {
    const tenses = [...new Set(items.map((i) => i.tense))]
    trackVerbDrillStarted({ tenses, verbSet: 'session', length: items.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus input when entering answering phase
  useEffect(() => {
    if (phase.kind === 'answering') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [phase, index])

  // Auto-advance after correct answer
  useEffect(() => {
    if (phase.kind !== 'feedback') return
    if (phase.result.outcome !== 'correct') return

    const t = setTimeout(() => {
      if (isLast) {
        setPhase({ kind: 'done' })
      } else {
        setIndex((i) => i + 1)
        setAnswer('')
        setPhase({ kind: 'answering' })
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [phase, isLast])

  const recordAttempt = useCallback(
    async (verbId: string, tense: string, isCorrect: boolean, idx: number) => {
      if (attemptRecordedRef.current.has(idx)) return
      attemptRecordedRef.current.add(idx)

      try {
        await fetch('/api/verbs/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verb_id: verbId, tense, is_correct: isCorrect }),
        })
      } catch {
        // fire-and-forget; don't block UI on network failure
      }
    },
    [],
  )

  function handleCheck() {
    if (!current || !answer.trim()) return

    const result = gradeConjugation(answer, current.correctForm, current.tenseRule)
    const isCorrect = result.outcome === 'correct'

    // Haptic + flash feedback
    if (isCorrect) triggerSuccess()
    else if (result.outcome === 'accent_error') triggerWarning()
    else triggerError()
    const cls = isCorrect ? 'animate-flash-green' : result.outcome === 'accent_error' ? 'animate-flash-orange' : 'animate-flash-red'
    setFlashClass(cls)
    setTimeout(() => setFlashClass(''), 400)

    // Record score locally (first attempt at this index)
    if (!attemptRecordedRef.current.has(index)) {
      setScores((prev) => new Map(prev).set(index, isCorrect))
    }

    // Fire-and-forget API call
    void recordAttempt(current.verbId, current.tense, isCorrect, index)

    setPhase({ kind: 'feedback', result })
  }

  function handleNext() {
    if (isLast) {
      setPhase({ kind: 'done' })
    } else {
      setIndex((i) => i + 1)
      setAnswer('')
      setPhase({ kind: 'answering' })
    }
  }

  function handleTryAgain() {
    setAnswer('')
    setPhase({ kind: 'answering' })
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  const doneTrackedRef = useRef(false)
  if (phase.kind === 'done' && !doneTrackedRef.current) {
    doneTrackedRef.current = true
    const correctCount = Array.from(scores.values()).filter(Boolean).length
    trackVerbDrillCompleted({ correct: correctCount, total: scores.size })
  }

  if (phase.kind === 'done') {
    const correctCount = Array.from(scores.values()).filter(Boolean).length
    return (
      <VerbSummary
        correct={correctCount}
        total={scores.size}
        tenseStats={buildTenseStats()}
        onPracticeAgain={() => router.push(sessionUrl)}
      />
    )
  }

  if (!current) return null

  // Parse sentence: replace '_____' with blank display
  const parts = current.sentence.split('_____')
  const beforeBlank = parts[0] ?? ''
  const afterBlank = parts[1] ?? ''

  const tenseLabel = TENSE_LABELS[current.tense as VerbTense] ?? current.tense
  const pronounLabel = PRONOUN_LABELS[current.pronoun] ?? current.pronoun

  return (
    <>
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
            <Button variant="destructive" onClick={() => router.push('/verbs')}>
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Row 1: segmented progress dots + X exit button */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: items.length }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= index ? 'bg-primary' : 'bg-[var(--d5-muted)]/30'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setShowExitDialog(true)}
            aria-label="Salir de la sesión"
            className="text-[var(--d5-muted)] hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Row 2: metadata eyebrow */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="senda-eyebrow" style={{ color: 'var(--d5-terracotta)' }}>Conjugación</span>
          <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
          <span className="text-[var(--d5-muted)]">{current.infinitive}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
          <span className="text-[var(--d5-muted)]">{tenseLabel}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
          <span className="text-[var(--d5-muted)]">{index + 1}/{items.length}</span>
        </div>

        {/* Exercise area with flash + entrance animation */}
        <div key={index} className={`space-y-3 rounded-xl transition-colors duration-300 animate-exercise-in ${flashClass}`}>
          {/* Sentence card */}
          <div className="senda-card space-y-4">
            <p className="text-base leading-relaxed">
              {beforeBlank}
              <span className="inline-block min-w-[4rem] border-b-2 border-primary mx-1 align-bottom" />
              {afterBlank}
            </p>

            {/* Hint row */}
            {showHint && (
              <div className="flex items-center gap-2 text-xs text-[var(--d5-muted)]">
                <span className="px-2 py-1 rounded bg-muted font-mono font-medium">[{current.infinitive}]</span>
                <span>·</span>
                <span>{tenseLabel}</span>
                <span>·</span>
                <span>{pronounLabel}</span>
              </div>
            )}
            {!showHint && (
              <div className="flex items-center gap-2 text-xs text-[var(--d5-muted)]">
                <span>{tenseLabel}</span>
                <span>·</span>
                <span>{pronounLabel}</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && phase.kind === 'answering') handleCheck() }}
              disabled={phase.kind === 'feedback'}
              placeholder="Escribe la forma conjugada…"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-xl border border-[var(--d5-muted)]/30 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />

            {phase.kind === 'answering' && (
              <Button
                onClick={handleCheck}
                disabled={!answer.trim()}
                className="w-full rounded-full active:scale-95 transition-transform"
              >
                Comprobar →
              </Button>
            )}
          </div>

          {/* Feedback */}
          {phase.kind === 'feedback' && (
            <VerbFeedbackPanel
              result={phase.result}
              onNext={handleNext}
              onTryAgain={handleTryAgain}
              isLast={isLast}
            />
          )}
        </div>
      </div>
    </>
  )
}
