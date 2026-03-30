'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FreeWritePrompt } from '@/components/exercises/FreeWritePrompt'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
import { trackFreeWriteSubmitted, trackFeatureFirstUse } from '@/lib/analytics'
import { ROUTES } from '@/lib/routes'
import type { GradeResult } from '@/lib/claude/grader'

interface ConceptInfo {
  id: string
  title: string
}

type State =
  | { phase: 'loading_prompt' }
  | { phase: 'writing'; prompt: string }
  | { phase: 'submitting'; prompt: string }
  | { phase: 'feedback'; prompt: string; answer: string; result: GradeResult & { next_review_in_days: number } }

interface Props {
  conceptIds: string[]
  conceptInfos: ConceptInfo[]
}

export function WriteSession({ conceptIds, conceptInfos }: Props) {
  const router = useRouter()
  const [state, setState] = useState<State>({ phase: 'loading_prompt' })
  const [error, setError] = useState<string | null>(null)

  const fetchPrompt = useCallback(async () => {
    setState({ phase: 'loading_prompt' })
    setError(null)
    try {
      const res = await fetch('/api/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept_ids: conceptIds }),
      })
      if (res.status === 401) {
        router.push(`${ROUTES.login}?returnUrl=/write`)
        return
      }
      if (res.status === 429) {
        setError('Has alcanzado el límite. Espera unos minutos.')
        setState({ phase: 'writing', prompt: '' })
        return
      }
      if (!res.ok) {
        console.error('[WriteSession] topic fetch failed:', res.status, await res.text().catch(() => ''))
        throw new Error(`Failed to generate prompt: ${res.status}`)
      }
      const data = await res.json() as { topic: string }
      setState({ phase: 'writing', prompt: data.topic })
    } catch (err) {
      console.error('[WriteSession] fetchPrompt error:', err)
      setError('No se pudo generar un tema. Inténtalo de nuevo.')
      setState({ phase: 'writing', prompt: '' })
    }
  }, [conceptIds, router])

  useEffect(() => {
    trackFeatureFirstUse('free_write')
  }, [])

  useEffect(() => {
    fetchPrompt()
  }, [fetchPrompt])

  async function handleSubmit(answer: string) {
    if (state.phase !== 'writing') return
    const prompt = state.prompt
    setState({ phase: 'submitting', prompt })
    setError(null)
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_ids: conceptIds,
          ai_prompt: prompt,
          user_answer: answer,
        }),
      })
      if (res.status === 401) {
        router.push(`${ROUTES.login}?returnUrl=/write`)
        return
      }
      if (!res.ok) {
        console.error('[WriteSession] grade failed:', res.status, await res.text().catch(() => ''))
        throw new Error(`Failed to grade answer: ${res.status}`)
      }
      const result = await res.json() as GradeResult & { next_review_in_days: number }
      trackFreeWriteSubmitted(conceptIds[0])
      setState({ phase: 'feedback', prompt, answer, result })
    } catch (err) {
      console.error('[WriteSession] handleSubmit error:', err)
      setError('No se pudo enviar tu respuesta. Inténtalo de nuevo.')
      setState({ phase: 'writing', prompt })
    }
  }

  const loadingPrompt = state.phase === 'loading_prompt'
  const currentPrompt = state.phase !== 'loading_prompt' ? state.prompt : ''
  const conceptTitle = conceptInfos.map((c) => c.title).join(' + ')

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3">{error}</p>
      )}

      {state.phase === 'feedback' ? (
        <div className="space-y-6">
          <FeedbackPanel
            result={state.result}
            userAnswer={state.answer}
            onNext={fetchPrompt}
            isLast={false}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={fetchPrompt} className="flex-1 rounded-full">
              Escribir otro →
            </Button>
          </div>
        </div>
      ) : (
        <FreeWritePrompt
          prompt={currentPrompt}
          conceptTitle={conceptTitle}
          onSubmit={handleSubmit}
          onRefreshPrompt={fetchPrompt}
          disabled={state.phase === 'submitting'}
          loadingPrompt={loadingPrompt}
        />
      )}
    </div>
  )
}
