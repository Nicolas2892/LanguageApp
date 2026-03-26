'use client'

import { useState, useCallback } from 'react'
import { X, Mic, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { fireAndForget } from '@/lib/fireAndForget'
import { isOnline } from '@/lib/platform/network'
import { usePronunciationRecording } from '@/lib/hooks/usePronunciationRecording'
import { SpeakButton } from '@/components/SpeakButton'
import { PronunciationFeedbackPanel } from '@/components/pronunciation/PronunciationFeedbackPanel'
import { PronunciationSummary } from '@/components/pronunciation/PronunciationSummary'
import type { PronunciationResult } from '@/lib/azure/client'

interface PronunciationItem {
  id: string
  displayText: string
  source: 'verb' | 'vocab'
}

type Phase =
  | { kind: 'answering' }
  | { kind: 'recording' }
  | { kind: 'assessing' }
  | { kind: 'feedback'; result: PronunciationResult }
  | { kind: 'done' }

interface Props {
  items: PronunciationItem[]
  l1Language: string | null
  sessionUrl: string
}

export function PronunciationSession({ items, l1Language, sessionUrl }: Props) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'answering' })
  const [results, setResults] = useState<PronunciationResult[]>([])
  const [flashClass, setFlashClass] = useState('')

  const recording = usePronunciationRecording()
  const current = items[index]
  const isLast = index === items.length - 1
  const progress = ((index + (phase.kind === 'done' ? 1 : 0)) / items.length) * 100

  // Watch recording state transitions
  const handleRecord = useCallback(() => {
    if (!current) return
    recording.reset()
    recording.startRecording(current.displayText)
    setPhase({ kind: 'recording' })
  }, [current, recording])

  const handleStopRecording = useCallback(() => {
    recording.stop()
    setPhase({ kind: 'assessing' })
  }, [recording])

  // Watch for result arrival
  if (phase.kind === 'assessing' && recording.result) {
    const result = recording.result
    setResults((prev) => [...prev, result])
    const score = result.overallScore
    const cls = score >= 70 ? 'animate-flash-green' : score >= 40 ? 'animate-flash-orange' : 'animate-flash-red'
    setFlashClass(cls)
    setTimeout(() => setFlashClass(''), 400)
    setPhase({ kind: 'feedback', result })
    trackProgress(result)
  }

  // Watch for recording errors during assessing phase
  if (phase.kind === 'assessing' && recording.error) {
    setPhase({ kind: 'answering' })
  }

  // Also handle: recording was in 'recording' state but hook stopped (auto-stop)
  if (phase.kind === 'recording' && recording.state === 'processing') {
    setPhase({ kind: 'assessing' })
  }

  const handleRetry = useCallback(() => {
    recording.reset()
    setPhase({ kind: 'answering' })
  }, [recording])

  const handleNext = useCallback(() => {
    recording.reset()
    if (isLast) {
      setPhase({ kind: 'done' })
    } else {
      setIndex((i) => i + 1)
      setPhase({ kind: 'answering' })
    }
  }, [isLast, recording])

  // ── Fire-and-forget progress tracking ──
  function trackProgress(result: PronunciationResult) {
    if (!isOnline()) return
    const THRESHOLD = 70
    const categories: { category: string; correct: boolean }[] = [
      { category: 'stress', correct: result.overallScore >= THRESHOLD },
      { category: 'fluency', correct: result.fluencyScore >= THRESHOLD },
      { category: 'prosody', correct: result.prosodyScore >= THRESHOLD },
    ]
    for (const entry of categories) {
      fireAndForget(
        fetch('/api/pronunciation/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }),
        'pronunciation-progress',
      )
    }
  }

  // ── Done screen ──
  if (phase.kind === 'done') {
    return <PronunciationSummary results={results} sessionUrl={sessionUrl} />
  }

  return (
    <div className={`flex-1 flex flex-col ${flashClass}`}>
      {/* Header: progress + exit */}
      <div className="shrink-0 flex items-center gap-3 mb-4">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <Link href={ROUTES.pronunciation} aria-label="Salir" className="shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors">
          <X size={18} className="text-muted-foreground" />
        </Link>
      </div>

      {/* Eyebrow */}
      <div className="shrink-0 mb-2">
        <span className="senda-eyebrow">
          Pronunciación · {index + 1}/{items.length}
        </span>
      </div>

      {/* Sentence card */}
      <div className="flex-1 flex flex-col justify-center py-4">
        <div className="senda-card space-y-4 animate-exercise-in" key={index}>
          <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--d5-ink)' }}>
            {current.displayText}
          </p>

          {/* Native audio */}
          <div className="flex items-center gap-2">
            <SpeakButton text={current.displayText} />
            <span className="text-xs" style={{ color: 'var(--d5-muted)' }}>Escuchar nativo</span>
          </div>
        </div>
      </div>

      {/* Bottom action area */}
      <div className="shrink-0 space-y-3 pb-2">
        {phase.kind === 'answering' && (
          <>
            {recording.error && (
              <p className="text-xs text-center" style={{ color: 'var(--d5-error, #dc2626)' }}>
                {recording.error === 'not-allowed' && 'Permiso de micrófono denegado. Actívalo en los ajustes del navegador.'}
                {recording.error === 'rate-limit' && 'Demasiados intentos. Espera un momento.'}
                {recording.error === 'network' && 'Error de conexión. Inténtalo de nuevo.'}
                {recording.error === 'audio-capture' && 'No se pudo acceder al micrófono.'}
                {recording.error === 'no-speech' && 'No se detectó audio. Inténtalo de nuevo.'}
              </p>
            )}
            <button
              type="button"
              onClick={handleRecord}
              disabled={!recording.supported}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Mic size={16} />
              Grabar
            </button>
          </>
        )}

        {phase.kind === 'recording' && (
          <button
            type="button"
            onClick={handleStopRecording}
            className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors animate-mic-sonar"
            style={{ background: 'rgba(196,82,46,0.12)', color: 'var(--d5-terracotta)' }}
          >
            <Mic size={16} />
            Detener Grabación
          </button>
        )}

        {phase.kind === 'assessing' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span className="text-sm" style={{ color: 'var(--d5-warm)' }}>Analizando pronunciación…</span>
          </div>
        )}

        {phase.kind === 'feedback' && (
          <PronunciationFeedbackPanel
            result={phase.result}
            sentence={current.displayText}
            l1Language={l1Language}
            userAudioUrl={recording.userAudioUrl}
            onRetry={handleRetry}
            onNext={handleNext}
            isLast={isLast}
          />
        )}
      </div>
    </div>
  )
}
