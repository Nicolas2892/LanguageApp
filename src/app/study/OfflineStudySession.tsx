'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer'
import { OfflineFeedbackPanel } from '@/components/offline/OfflineFeedbackPanel'
import { HintPanel } from '@/components/exercises/HintPanel'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { Button } from '@/components/ui/button'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { CloudOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import {
  queueAttempt,
  putOfflineSession,
  getFreeWritePrompt,
  getAllDownloadedModules,
} from '@/lib/offline/db'
import { buildOfflineQueue } from '@/lib/offline/buildOfflineQueue'
import type { StudyItem } from '@/lib/studyUtils'
import type { DownloadedModule } from '@/lib/offline/types'

type SessionState =
  | { phase: 'loading' }
  | { phase: 'answering' }
  | { phase: 'feedback'; userAnswer: string }
  | { phase: 'done'; total: number }

interface Props {
  moduleId?: string
}

export function OfflineStudySession({ moduleId }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<StudyItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [state, setState] = useState<SessionState>({ phase: 'loading' })
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const sessionIdRef = useRef(crypto.randomUUID())
  const startedAtRef = useRef(new Date().toISOString())

  // Available modules for picker
  const [modules, setModules] = useState<DownloadedModule[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(moduleId)

  useEffect(() => {
    getAllDownloadedModules().then(setModules)
  }, [])

  // Build queue when module selection changes
  useEffect(() => {
    let cancelled = false
    async function load() {
      setState({ phase: 'loading' })
      const queue = await buildOfflineQueue({ moduleId: selectedModuleId })
      if (cancelled) return
      setItems(queue)
      setCurrentIndex(0)
      setWrongAttempts(0)
      if (queue.length === 0) {
        setState({ phase: 'done', total: 0 })
      } else {
        setState({ phase: 'answering' })
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedModuleId])

  const currentItem = items[currentIndex]

  const handleSubmit = useCallback(async (answer: string) => {
    if (!currentItem) return

    // Queue the attempt in IDB
    await queueAttempt({
      session_id: sessionIdRef.current,
      exercise_id: currentItem.exercise.id,
      concept_id: currentItem.concept.id,
      concept_title: currentItem.concept.title,
      exercise_type: currentItem.exercise.type,
      exercise_prompt: currentItem.exercise.prompt,
      user_answer: answer,
      expected_answer: currentItem.exercise.expected_answer,
      answer_variants: currentItem.exercise.answer_variants as string[] | null,
      attempted_at: new Date().toISOString(),
      synced: 0,
    })

    // Show neutral feedback
    setFlash('animate-flash-green')
    setTimeout(() => setFlash(null), 300)
    setState({ phase: 'feedback', userAnswer: answer })
  }, [currentItem])

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= items.length) {
      // Session done — save to IDB
      putOfflineSession({
        id: sessionIdRef.current,
        started_at: startedAtRef.current,
        ended_at: new Date().toISOString(),
        exercise_count: items.length,
        module_id: selectedModuleId ?? null,
        synced: 0,
      })
      setState({ phase: 'done', total: items.length })
    } else {
      setCurrentIndex(nextIndex)
      setWrongAttempts(0)
      setState({ phase: 'answering' })
    }
  }, [currentIndex, items.length, selectedModuleId])

  // Loading state
  if (state.phase === 'loading') {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--d5-muted)' }}>
          Cargando ejercicios offline…
        </p>
      </div>
    )
  }

  // Done state
  if (state.phase === 'done') {
    return (
      <div className="max-w-xl mx-auto p-6 text-center animate-page-in relative overflow-hidden">
        <BackgroundMagicS opacity={0.05} />
        <div className="py-8">
          <CloudOff size={32} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: 'var(--d5-warm)' }} />
          <h2 className="senda-heading text-xl mb-2">Sesión Offline Completa</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--d5-body)' }}>
            {state.total} {state.total === 1 ? 'ejercicio completado' : 'ejercicios completados'}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--d5-muted)' }}>
            Tus respuestas se calificarán cuando vuelvas a conectarte.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="rounded-full">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-xl mx-auto p-6 animate-page-in ${flash ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--d5-warm)' }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Salir
        </button>

        <div className="flex items-center gap-2">
          <CloudOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-warm)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--d5-warm)' }}>
            Offline
          </span>
        </div>

        <span className="text-xs" style={{ color: 'var(--d5-muted)' }}>
          {currentIndex + 1}/{items.length}
        </span>
      </div>

      {/* Module picker (if multiple modules downloaded) */}
      {modules.length > 1 && state.phase === 'answering' && currentIndex === 0 && (
        <div className="mb-4">
          <select
            value={selectedModuleId ?? ''}
            onChange={e => setSelectedModuleId(e.target.value || undefined)}
            className="senda-input text-sm"
          >
            <option value="">Todos los módulos (SRS)</option>
            {modules.map(m => (
              <option key={m.module_id} value={m.module_id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-6" style={{ background: 'var(--d5-surface-tint)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + (state.phase === 'feedback' ? 1 : 0)) / items.length) * 100}%`,
            background: 'var(--d5-terracotta)',
          }}
        />
      </div>

      {/* Concept info */}
      {currentItem && (
        <>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="senda-heading text-base">{currentItem.concept.title}</h2>
              <GrammarFocusChip focus={currentItem.concept.grammar_focus} />
            </div>
          </div>

          {/* Exercise */}
          {state.phase === 'answering' && (
            <div className="animate-exercise-in">
              <ExerciseRenderer
                exercise={currentItem.exercise}
                onSubmit={handleSubmit}
                disabled={false}
              />
            </div>
          )}

          {/* Hints (offline: only hint_1 and hint_2, no worked example) */}
          {state.phase === 'answering' && wrongAttempts > 0 && (
            <HintPanel
              hint1={currentItem.exercise.hint_1}
              hint2={currentItem.exercise.hint_2}
              claudeHint={null}
              wrongAttempts={wrongAttempts}
              loadingHint={false}
              onRequestHint={() => {/* no-op offline */}}
            />
          )}

          {/* Feedback */}
          {state.phase === 'feedback' && (
            <OfflineFeedbackPanel
              userAnswer={state.userAnswer}
              onNext={handleNext}
            />
          )}
        </>
      )}
    </div>
  )
}
