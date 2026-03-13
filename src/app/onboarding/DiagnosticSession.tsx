'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { SvgTilde } from '@/components/SvgTilde'
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
      if (!res.ok || !res.body) {
        throw new Error(`Submit failed: ${res.status}`)
      }
      // Read NDJSON stream (two JSON lines: score chunk + details chunk)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const chunks: Record<string, unknown>[] = []
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (value) buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.trim()) chunks.push(JSON.parse(line))
        }
        if (done) break
      }
      // Merge score chunk + details chunk into a single GradeResult
      const result = Object.assign({}, ...chunks) as GradeResult & { next_review_in_days: number }
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
      setSubmitError('Algo salió mal. Inténtalo de nuevo.')
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
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results }),
        })
        if (!res.ok) throw new Error(`Onboarding complete failed: ${res.status}`)
        router.push('/dashboard')
      } catch {
        // If completion fails, user would be stuck in redirect loop — retry
        setCompleting(false)
        setState({ phase: 'answering' })
        setSubmitError('No se pudo completar el diagnóstico. Inténtalo de nuevo.')
      }
    } else {
      setIndex((i) => i + 1)
      setState({ phase: 'answering' })
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-sm text-[var(--d5-muted)]">
          No se encontraron ejercicios de diagnóstico. Contacta soporte o{' '}
          <a href="/dashboard" className="underline text-primary">ve al inicio</a>.
        </p>
      </div>
    )
  }

  if (state.phase === 'done') {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="flex justify-center"><SvgTilde size={56} /></div>
        <h2 className="senda-heading text-lg">¡Listo! Tu repaso se está construyendo.</h2>
        <p className="text-sm text-[var(--d5-muted)]">
          {completing ? 'Personalizando tu repaso…' : 'Redirigiendo al inicio…'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress dots — segmented bar */}
      <div className="flex gap-1">
        {items.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-primary' : 'bg-[var(--d5-muted)]/30'}`}
          />
        ))}
      </div>

      {/* Concept context */}
      <div className="senda-card text-sm space-y-1">
        <p className="senda-eyebrow">Concepto</p>
        <p>{current.concept.explanation}</p>
      </div>

      {/* Exercise */}
      <div className="space-y-3">
        {state.phase === 'answering' && (
          <>
            <ExerciseRenderer exercise={current.exercise} onSubmit={handleSubmit} disabled={submitting} />
            {submitting && (
              <p className="text-sm text-[var(--d5-muted)] animate-senda-pulse">Evaluando…</p>
            )}
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </>
        )}

        {state.phase === 'feedback' && (() => {
          const config = SCORE_CONFIG[state.result.score]
          return (
            <div className="senda-feedback-card space-y-4">
              {/* Score badge + tilde */}
              <div className="flex items-center gap-3">
                <span className={`senda-score-pill ${config.className}`}>
                  {config.label}
                </span>
                <SvgTilde size={32} />
              </div>

              {/* Feedback */}
              <p className="text-base">{state.result.feedback}</p>

              {/* Answer comparison */}
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-[var(--d5-muted)] w-28 shrink-0">Tu respuesta:</span>
                  <span className={state.result.is_correct ? 'text-green-700' : 'text-red-700'}>
                    {state.userAnswer}
                  </span>
                </div>
                {!state.result.is_correct && (
                  <div className="flex gap-2">
                    <span className="text-[var(--d5-muted)] w-28 shrink-0">Correcto:</span>
                    <span className="text-green-700 font-medium">{state.result.corrected_version}</span>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {state.result.explanation && (
                <p className="text-sm text-[var(--d5-muted)] border-l-2 border-l-primary pl-3 italic">
                  {state.result.explanation}
                </p>
              )}

              <button
                onClick={handleNext}
                className="w-full inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90"
              >
                {index + 1 >= items.length ? 'Finalizar diagnóstico' : 'Siguiente →'}
              </button>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
