'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { fireAndForget } from '@/lib/fireAndForget'
import { isOnline } from '@/lib/platform/network'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { VerbExerciseInline } from '@/components/exercises/VerbExerciseInline'
import { VocabExerciseInline } from '@/components/exercises/VocabExerciseInline'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { sm2 } from '@/lib/srs'
import { verbOutcomeToSRS, vocabOutcomeToSRS } from '@/lib/srs/scoreMapping'
import { useHaptics } from '@/lib/hooks/useHaptics'
import type { UnifiedStudyItem } from './types'
import type { GradeResult } from '@/lib/claude/grader'

type Phase =
  | { kind: 'answering' }
  | { kind: 'submitting' }
  | { kind: 'grammar-feedback'; result: GradeResult & { next_review_in_days: number }; userAnswer: string }
  | { kind: 'local-feedback'; score: number; nextReviewDays: number }
  | { kind: 'done' }

interface Props {
  items: UnifiedStudyItem[]
}

export function UnifiedStudySession({ items }: Props) {
  const router = useRouter()
  const { triggerSuccess, triggerError } = useHaptics()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' })
  const [flashClass, setFlashClass] = useState('')
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [scores, setScores] = useState<Map<number, boolean>>(new Map())
  const attemptRecordedRef = useRef(new Set<number>())
  const [disabled, setDisabled] = useState(false)

  const current = items[index]
  const isLast = index === items.length - 1
  const progress = ((index + (phase.kind === 'done' ? 1 : 0)) / items.length) * 100

  // ── Grammar exercise submission (Claude grading via NDJSON) ──
  const handleGrammarSubmit = useCallback(async (userAnswer: string) => {
    if (current.type !== 'concept') return
    setDisabled(true)
    setPhase({ kind: 'submitting' })

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: current.exercise.id,
          concept_id: current.concept.id,
          user_answer: userAnswer,
        }),
      })

      if (!res.ok) {
        setPhase({ kind: 'answering' })
        setDisabled(false)
        return
      }

      const text = await res.text()
      const lines = text.trim().split('\n')
      const scoreChunk = JSON.parse(lines[0])
      const detailsChunk = lines[1] ? JSON.parse(lines[1]) : {}

      const isCorrect = scoreChunk.is_correct
      if (isCorrect) triggerSuccess()
      else triggerError()

      const cls = isCorrect ? 'animate-flash-green' : 'animate-flash-red'
      setFlashClass(cls)
      setTimeout(() => setFlashClass(''), 400)

      if (!attemptRecordedRef.current.has(index)) {
        setScores((prev) => new Map(prev).set(index, isCorrect))
        attemptRecordedRef.current.add(index)
      }

      setPhase({
        kind: 'grammar-feedback',
        result: {
          score: scoreChunk.score,
          is_correct: isCorrect,
          feedback: detailsChunk.feedback ?? '',
          corrected_version: detailsChunk.corrected_version ?? '',
          explanation: detailsChunk.explanation ?? '',
          next_review_in_days: scoreChunk.next_review_in_days ?? 1,
        },
        userAnswer,
      })
      setDisabled(false)
    } catch {
      setPhase({ kind: 'answering' })
      setDisabled(false)
    }
  }, [current, index, triggerSuccess, triggerError])

  // ── Verb/Vocab local grading callback ──
  const handleLocalGraded = useCallback((outcome: 'correct' | 'accent_error' | 'incorrect') => {
    if (attemptRecordedRef.current.has(index)) return
    attemptRecordedRef.current.add(index)

    const isCorrect = outcome !== 'incorrect'
    if (isCorrect) triggerSuccess()
    else triggerError()

    setScores((prev) => new Map(prev).set(index, isCorrect))

    const score = current.type === 'verb'
      ? verbOutcomeToSRS(outcome)
      : vocabOutcomeToSRS(outcome)
    const srsResult = sm2({ ease_factor: 2.5, interval_days: 1, repetitions: 0 }, score)

    if (isOnline()) {
      const body = current.type === 'verb'
        ? { item_type: 'verb', verb_id: current.verbId, tense: current.tense, outcome }
        : current.type === 'vocab'
        ? { item_type: 'vocab', vocab_id: current.vocabId, outcome }
        : null

      if (body) {
        fireAndForget(
          fetch('/api/srs/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
          'srs-grade',
        )
      }
    }

    setPhase({ kind: 'local-feedback', score, nextReviewDays: srsResult.interval_days })
  }, [current, index, triggerSuccess, triggerError])

  const handleNext = useCallback(() => {
    if (isLast) {
      setPhase({ kind: 'done' })
    } else {
      setIndex((i) => i + 1)
      setPhase({ kind: 'answering' })
    }
  }, [isLast])

  const handleTryAgain = useCallback(() => {
    setPhase({ kind: 'answering' })
  }, [])

  // ── Done screen ──
  if (phase.kind === 'done') {
    const correctCount = Array.from(scores.values()).filter(Boolean).length
    const pct = items.length > 0 ? Math.round((correctCount / items.length) * 100) : 0

    // Per-type breakdown
    const typeStats = new Map<string, { correct: number; total: number }>()
    items.forEach((item, i) => {
      const label = item.type === 'concept' ? 'Gramática' : item.type === 'verb' ? 'Verbos' : 'Vocabulario'
      const prev = typeStats.get(label) ?? { correct: 0, total: 0 }
      prev.total++
      if (scores.get(i)) prev.correct++
      typeStats.set(label, prev)
    })

    return (
      <div className="max-w-md mx-auto text-center space-y-6 animate-done-stagger relative overflow-hidden">
        <BackgroundMagicS />
        <div>
          <p className="senda-eyebrow mb-2">Sesión Completada</p>
          <p className="senda-heading text-3xl">{pct}%</p>
          <p className="text-sm mt-1" style={{ color: 'var(--d5-warm)' }}>
            {correctCount}/{items.length} correctas
          </p>
        </div>
        {typeStats.size > 1 && (
          <div className="senda-card-sm text-left space-y-2">
            {Array.from(typeStats.entries()).map(([label, s]) => {
              const typePct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
              return (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--d5-warm)' }}>{label}</span>
                  <span className="font-semibold">{typePct}% <span className="font-normal text-xs" style={{ color: 'var(--d5-muted)' }}>({s.correct}/{s.total})</span></span>
                </div>
              )
            })}
          </div>
        )}
        <div className="space-y-2">
          <Button onClick={() => router.push(ROUTES.studyConfigure)} className="w-full rounded-full">
            Nueva Sesión
          </Button>
          <Link href={ROUTES.dashboard} className="senda-cta-outline w-full block text-center">
            Volver al Inicio
          </Link>
        </div>
      </div>
    )
  }

  const itemLabel = current.type === 'concept'
    ? current.concept.title
    : current.type === 'verb'
    ? current.verb.infinitive
    : current.vocabItem.expression

  return (
    <div className={`flex-1 flex flex-col ${flashClass}`}>
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 mb-4">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <button type="button" onClick={() => setShowExitDialog(true)} className="shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors" aria-label="Salir">
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Eyebrow */}
      <div className="shrink-0 mb-2">
        <span className="senda-eyebrow">{index + 1}/{items.length} · {itemLabel}</span>
      </div>

      {/* Exercise area */}
      <div className="flex-1 flex flex-col justify-center py-4" key={index}>
        {/* Grammar: answering */}
        {current.type === 'concept' && (phase.kind === 'answering' || phase.kind === 'submitting') && (
          <div className="space-y-4 animate-exercise-in">
            <ExerciseRenderer exercise={current.exercise} onSubmit={handleGrammarSubmit} disabled={disabled || phase.kind === 'submitting'} />
            {phase.kind === 'submitting' && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-sm" style={{ color: 'var(--d5-warm)' }}>Evaluando…</span>
              </div>
            )}
          </div>
        )}

        {/* Grammar: feedback */}
        {current.type === 'concept' && phase.kind === 'grammar-feedback' && (
          <div className="animate-exercise-in">
            <FeedbackPanel
              result={phase.result}
              userAnswer={phase.userAnswer}
              onNext={handleNext}
              onTryAgain={phase.result.score <= 1 ? handleTryAgain : undefined}
              isLast={isLast}
            />
          </div>
        )}

        {/* Verb: answering */}
        {current.type === 'verb' && phase.kind === 'answering' && (
          <div className="animate-exercise-in">
            <VerbExerciseInline
              item={{
                verbId: current.verbId,
                infinitive: current.verb.infinitive,
                tense: current.tense,
                pronoun: current.sentence.pronoun,
                sentence: current.sentence.sentence,
                correctForm: current.sentence.correct_form,
                tenseRule: current.sentence.tense_rule,
                english: current.sentence.english,
              }}
              showHint={false}
              onGraded={handleLocalGraded}
            />
          </div>
        )}

        {/* Vocab: answering */}
        {current.type === 'vocab' && phase.kind === 'answering' && (
          <div className="animate-exercise-in">
            <VocabExerciseInline
              item={{
                vocabId: current.vocabId,
                expression: current.vocabItem.expression,
                category: current.vocabItem.category,
                sentence: current.sentence.sentence,
                correctForm: current.sentence.correct_form,
                answerVariants: current.sentence.answer_variants,
                english: current.sentence.english,
                hint: current.sentence.hint,
              }}
              showHint={false}
              onGraded={handleLocalGraded}
            />
          </div>
        )}

        {/* Verb/vocab: feedback (inline component already shows result, just need next button) */}
        {(current.type === 'verb' || current.type === 'vocab') && phase.kind === 'local-feedback' && (
          <div className="space-y-4">
            <p className="text-xs text-center" style={{ color: 'var(--d5-muted)' }}>
              Próxima revisión en {phase.nextReviewDays} día{phase.nextReviewDays !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {phase.score === 0 && (
                <Button onClick={handleTryAgain} variant="outline" className="flex-1 rounded-full">
                  Reintentar
                </Button>
              )}
              <Button onClick={handleNext} className="flex-1 rounded-full">
                {isLast ? 'Finalizar' : 'Siguiente →'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Exit dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir de la sesión?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tu progreso parcial se ha guardado.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>Continuar</Button>
            <Button onClick={() => router.push(ROUTES.dashboard)}>Salir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
