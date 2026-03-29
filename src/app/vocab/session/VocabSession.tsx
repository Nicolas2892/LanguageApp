'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/routes'
import { fireAndForget } from '@/lib/fireAndForget'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DrillInputBar } from '@/components/DrillInputBar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { gradeVocab } from '@/lib/vocab/grader'
import type { VocabGradeResult } from '@/lib/vocab/grader'
import { CATEGORY_LABELS } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'
import type { VocabSessionItem, VocabCategoryStat } from '@/lib/vocab/types'
import { VocabFeedbackPanel } from '@/components/vocab/VocabFeedbackPanel'
import { VocabSummary } from '@/components/vocab/VocabSummary'
import { SpeakButton } from '@/components/SpeakButton'
import { useHaptics } from '@/lib/hooks/useHaptics'
import { focusWithoutScroll } from '@/lib/hooks/useAutoFocus'
import { trackVocabDrillStarted, trackVocabDrillCompleted, trackFeatureFirstUse } from '@/lib/analytics'
import { isOnline } from '@/lib/platform/network'

type Phase =
  | { kind: 'answering' }
  | { kind: 'feedback'; result: VocabGradeResult }
  | { kind: 'done' }

interface Props {
  items: VocabSessionItem[]
  showHint: boolean
  sessionUrl: string
}

export function VocabSession({ items, showHint, sessionUrl }: Props) {
  const router = useRouter()
  const { triggerSuccess, triggerError, triggerWarning } = useHaptics()
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' })
  const [flashClass, setFlashClass] = useState('')
  const [showExitDialog, setShowExitDialog] = useState(false)

  const [scores, setScores] = useState<Map<number, boolean>>(new Map())
  const attemptRecordedRef = useRef(new Set<number>())
  const inputRef = useRef<HTMLInputElement>(null)

  const current = items[index]
  const isLast = index === items.length - 1

  function buildCategoryStats(): VocabCategoryStat[] {
    const map = new Map<string, { correct: number; total: number }>()
    scores.forEach((isCorrect, idx) => {
      const item = items[idx]
      if (!item) return
      const entry = map.get(item.category) ?? { correct: 0, total: 0 }
      entry.total++
      if (isCorrect) entry.correct++
      map.set(item.category, entry)
    })
    return Array.from(map.entries()).map(([category, s]) => ({ category, ...s }))
  }

  // Track drill start on mount
  useEffect(() => {
    const categories = [...new Set(items.map((i) => i.category))]
    trackVocabDrillStarted({ categories, length: items.length })
    trackFeatureFirstUse('vocab_drill')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus input when entering answering phase
  useEffect(() => {
    if (phase.kind === 'answering') {
      setTimeout(() => focusWithoutScroll(inputRef.current), 50)
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
    async (vocabId: string, isCorrect: boolean, idx: number) => {
      if (attemptRecordedRef.current.has(idx)) return
      attemptRecordedRef.current.add(idx)

      if (isOnline()) {
        fireAndForget(
          fetch('/api/vocab/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vocab_id: vocabId, is_correct: isCorrect }),
          }),
          'vocab-grade',
        )
      } else {
        // Offline — queue for later sync
        try {
          const { queueVocabAttempt } = await import('@/lib/offline/db')
          await queueVocabAttempt({
            vocab_id: vocabId,
            correct: isCorrect,
            attempted_at: new Date().toISOString(),
            synced: 0,
          })
        } catch {
          // IDB not available
        }
      }
    },
    [],
  )

  function handleCheck() {
    if (!current || !answer.trim()) return

    const result = gradeVocab(answer, current.correctForm, current.answerVariants, current.hint)
    const isCorrect = result.outcome === 'correct'

    if (isCorrect) triggerSuccess()
    else if (result.outcome === 'accent_error') triggerWarning()
    else triggerError()

    const cls = isCorrect ? 'animate-flash-green' : result.outcome === 'accent_error' ? 'animate-flash-orange' : 'animate-flash-red'
    setFlashClass(cls)
    setTimeout(() => setFlashClass(''), 400)

    if (!attemptRecordedRef.current.has(index)) {
      setScores((prev) => new Map(prev).set(index, isCorrect))
    }

    void recordAttempt(current.vocabId, isCorrect, index)
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
    trackVocabDrillCompleted({ correct: correctCount, total: scores.size })

    // Seed SRS items for all practiced vocab items
    if (isOnline()) {
      const uniqueItems = new Map<string, { item_type: 'vocab'; vocab_id: string }>()
      for (const item of items) {
        if (!uniqueItems.has(item.vocabId)) {
          uniqueItems.set(item.vocabId, { item_type: 'vocab', vocab_id: item.vocabId })
        }
      }
      fireAndForget(
        fetch('/api/srs/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: Array.from(uniqueItems.values()) }),
        }),
        'srs-seed-vocab',
      )
    }
  }

  if (phase.kind === 'done') {
    const correctCount = Array.from(scores.values()).filter(Boolean).length
    return (
      <VocabSummary
        correct={correctCount}
        total={scores.size}
        categoryStats={buildCategoryStats()}
        onPracticeAgain={() => router.push(sessionUrl)}
      />
    )
  }

  if (!current) return null

  // Parse sentence: replace '_____' with blank display
  const parts = current.sentence.split('_____')
  const beforeBlank = parts[0] ?? ''
  const afterBlank = parts[1] ?? ''

  const categoryLabel = CATEGORY_LABELS[current.category as VocabCategory] ?? current.category

  return (
    <>
      {/* Exit confirmation dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir de la Sesión?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tu progreso parcial se ha guardado.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Seguir
            </Button>
            <Button variant="destructive" onClick={() => router.push(ROUTES.verbs)}>
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col min-h-[calc(100dvh-10rem)]">
        {/* Pinned top: progress + eyebrow */}
        <div className="shrink-0 space-y-4">
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
            <span className="senda-eyebrow" style={{ color: 'var(--d5-terracotta)' }}>
              Vocabulario
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
            <span className="text-[var(--d5-muted)]">{categoryLabel}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--d5-muted)]" aria-hidden />
            <span className="text-[var(--d5-muted)]">{index + 1}/{items.length}</span>
          </div>
        </div>

        {/* Centered exercise area */}
        <div className="flex-1 flex flex-col justify-center py-4">
          <div key={index} className={`space-y-3 rounded-xl transition-colors duration-300 animate-exercise-in ${flashClass}`}>
            {/* Sentence card */}
            <div className="senda-card space-y-4">
              <div className="flex items-start gap-2">
                <p className="text-base leading-relaxed flex-1">
                  {beforeBlank}
                  <span className="inline-block min-w-[4rem] border-b-2 border-primary mx-1 align-bottom" />
                  {afterBlank}
                </p>
                <SpeakButton text={current.sentence.replace('_____', current.correctForm)} />
              </div>

              {/* English translation */}
              <p className="text-sm italic text-[var(--d5-muted)]">{current.english}</p>

              {/* Hint row */}
              {showHint && current.hint && (
                <div className="flex items-center gap-2 text-xs text-[var(--d5-muted)]">
                  <span className="px-2 py-1 rounded bg-muted font-mono font-medium">[{current.hint}]</span>
                </div>
              )}
            </div>

            {/* Spacer for fixed input bar on mobile */}
            {phase.kind === 'answering' && (
              <div className="h-[calc(7rem+env(safe-area-inset-bottom))] lg:hidden" />
            )}

            {/* Correct answer — inline success display */}
            {phase.kind === 'feedback' && phase.result.outcome === 'correct' && (
              <div className="space-y-3">
                <div className="senda-dashed-input flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden />
                  <span className="text-base font-medium text-green-700 dark:text-green-400">
                    {phase.result.correctForm}
                  </span>
                </div>
              </div>
            )}

            {/* Incorrect / accent_error — full feedback card */}
            {phase.kind === 'feedback' && phase.result.outcome !== 'correct' && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
                <VocabFeedbackPanel
                  result={phase.result}
                  onNext={handleNext}
                  onTryAgain={handleTryAgain}
                  isLast={isLast}
                  answerVariants={current.answerVariants}
                  completedSentence={current.sentence.replace('_____', current.correctForm)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed input bar — outside flex column to avoid transform ancestor */}
      {phase.kind === 'answering' && (
        <DrillInputBar
          inputRef={inputRef}
          value={answer}
          onChange={setAnswer}
          onSubmit={handleCheck}
          placeholder="Escribe la expresión…"
          disabled={!answer.trim()}
        />
      )}
    </>
  )
}
