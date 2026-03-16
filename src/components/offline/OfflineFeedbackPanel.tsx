'use client'

import { Button } from '@/components/ui/button'
import { CloudOff } from 'lucide-react'

interface Props {
  userAnswer: string
  onNext: () => void
}

/**
 * Neutral feedback panel shown during offline study sessions.
 * No score — the answer is queued for grading when back online.
 */
export function OfflineFeedbackPanel({ userAnswer, onNext }: Props) {
  return (
    <div className="senda-card animate-exercise-in" style={{ marginTop: '1rem' }}>
      <div className="flex items-start gap-3">
        <CloudOff
          size={18}
          strokeWidth={1.5}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--d5-warm)' }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--d5-ink)' }}
          >
            Respuesta registrada
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--d5-muted)' }}
          >
            Tu respuesta se calificará cuando vuelvas a conectarte.
          </p>
          <div
            className="mt-2 rounded-lg px-3 py-2 text-sm"
            style={{
              background: 'rgba(140,106,63,0.05)',
              color: 'var(--d5-body)',
            }}
          >
            {userAnswer}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={onNext}
          className="w-full rounded-full active:scale-95 transition-transform"
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
