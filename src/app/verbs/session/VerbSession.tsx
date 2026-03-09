'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { gradeConjugation } from '@/lib/verbs/grader'
import type { VerbGradeResult } from '@/lib/verbs/grader'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import type { VerbTense } from '@/lib/verbs/constants'
import { VerbFeedbackPanel } from '@/components/verbs/VerbFeedbackPanel'
import { VerbSummary } from '@/components/verbs/VerbSummary'

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
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' })
  const [flashClass, setFlashClass] = useState('')

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

    // Flash animation
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

  function handleExit() {
    router.push('/verbs')
  }

  // ── Done screen ────────────────────────────────────────────────────────────
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
    <main className={`max-w-lg mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10 ${flashClass}`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleExit}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Exit session"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 mx-4">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((index + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs font-medium text-muted-foreground shrink-0">
          {index + 1}/{items.length}
        </p>
      </div>

      {/* Sentence card */}
      <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
        <p className="text-base leading-relaxed">
          {beforeBlank}
          <span className="inline-block min-w-[4rem] border-b-2 border-primary mx-1 align-bottom" />
          {afterBlank}
        </p>

        {/* Hint row */}
        {showHint && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted font-mono font-medium">[{current.infinitive}]</span>
            <span>·</span>
            <span>{tenseLabel}</span>
            <span>·</span>
            <span>{pronounLabel}</span>
          </div>
        )}
        {!showHint && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
          placeholder="Type the conjugated form..."
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />

        {phase.kind === 'answering' && (
          <button
            onClick={handleCheck}
            disabled={!answer.trim()}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Check →
          </button>
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
    </main>
  )
}
