'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { FreeWritePrompt } from '@/components/exercises/FreeWritePrompt'
import { FeedbackPanel } from '@/components/exercises/FeedbackPanel'
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
      if (!res.ok) throw new Error('Failed to generate prompt')
      const data = await res.json() as { topic: string }
      setState({ phase: 'writing', prompt: data.topic })
    } catch {
      setError('Could not generate a prompt. Please try again.')
      setState({ phase: 'writing', prompt: '' })
    }
  }, [conceptIds])

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
      if (!res.ok) throw new Error('Failed to grade answer')
      const result = await res.json() as GradeResult & { next_review_in_days: number }
      setState({ phase: 'feedback', prompt, answer, result })
    } catch {
      setError('Could not submit your answer. Please try again.')
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
            <Button variant="outline" onClick={fetchPrompt} className="flex-1">
              Write another →
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
