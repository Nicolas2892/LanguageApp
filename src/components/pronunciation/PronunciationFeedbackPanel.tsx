'use client'

import { Volume2 } from 'lucide-react'
import { useSpeech } from '@/lib/hooks/useSpeech'
import { WordScoreChips } from './WordScoreChips'
import { L1_TIPS, classifyPhoneme } from '@/lib/pronunciation/l1-maps'
import type { PronunciationResult } from '@/lib/azure/client'

interface Props {
  result: PronunciationResult
  sentence: string
  l1Language: string | null
  userAudioUrl: string | null
  nativeAudioUrl?: string | null
  onRetry: () => void
  onNext: () => void
  isLast: boolean
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium w-16 shrink-0" style={{ color: 'var(--d5-warm)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color: 'var(--d5-ink)' }}>{score}%</span>
    </div>
  )
}

export function PronunciationFeedbackPanel({
  result, sentence, l1Language, userAudioUrl, nativeAudioUrl, onRetry, onNext, isLast,
}: Props) {
  const { speak } = useSpeech()

  // Find worst-scored word for L1 tip
  const worstWord = result.words.length > 0
    ? result.words.reduce((a, b) => (a.accuracyScore < b.accuracyScore ? a : b))
    : null

  // Find relevant L1 tip based on worst phoneme category
  const l1Tip = l1Language && worstWord && worstWord.accuracyScore < 70
    ? findRelevantTip(l1Language, worstWord)
    : null

  return (
    <div className="space-y-4">
      {/* Word-level chips */}
      <WordScoreChips words={result.words} />

      {/* Score bars */}
      <div className="space-y-2">
        <ScoreBar label="Precisión" score={result.overallScore} />
        <ScoreBar label="Fluidez" score={result.fluencyScore} />
        <ScoreBar label="Prosodia" score={result.prosodyScore} />
      </div>

      {/* L1 tip */}
      {l1Tip && (
        <div className="senda-card text-xs space-y-1" style={{ padding: '0.75rem' }}>
          <p className="font-semibold" style={{ color: 'var(--d5-ink)' }}>💡 {l1Tip.description}</p>
          <p style={{ color: 'var(--d5-warm)' }}>{l1Tip.tip}</p>
        </div>
      )}

      {/* Audio comparison */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (nativeAudioUrl) {
              const audio = new Audio(nativeAudioUrl)
              audio.play()
            } else {
              speak(sentence, 'es-ES')
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors"
          style={{ background: 'rgba(140,106,63,0.07)', color: 'var(--d5-warm)' }}
        >
          <Volume2 size={14} />
          Nativo
        </button>
        {userAudioUrl && (
          <button
            type="button"
            onClick={() => {
              const audio = new Audio(userAudioUrl)
              audio.play()
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: 'rgba(196,82,46,0.08)', color: 'var(--d5-terracotta)' }}
          >
            <Volume2 size={14} />
            Tú
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ background: 'rgba(140,106,63,0.07)', color: 'var(--d5-warm)' }}
        >
          Repetir
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {isLast ? 'Finalizar' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}

function findRelevantTip(l1: string, word: { phonemes: { phoneme: string; score: number }[] }) {
  const tips = L1_TIPS[l1]
  if (!tips) return null

  const category = classifyPhoneme(word)
  if (!category) return tips.stress ?? null

  return tips[category] ?? tips.consonants
}
