'use client'

import { useState, useEffect } from 'react'
import { Flame, X } from 'lucide-react'

const MILESTONES = [7, 14, 30, 60, 100] as const

interface Props {
  streak: number
}

export function StreakMilestone({ streak }: Props) {
  const [visible, setVisible] = useState(false)
  const [milestone, setMilestone] = useState<number | null>(null)

  useEffect(() => {
    const matched = MILESTONES.find((m) => streak >= m)
    if (!matched) return

    // Find the highest milestone reached
    const highest = [...MILESTONES].reverse().find((m) => streak >= m)
    if (!highest) return

    const key = `streak_milestone_${highest}_seen`
    try {
      if (localStorage.getItem(key)) return
      setMilestone(highest)
      setVisible(true)

      if (highest >= 30) {
        import('canvas-confetti')
          .then(({ default: confetti }) => {
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } })
          })
          .catch(() => {})
      }
    } catch {
      // localStorage unavailable
    }
  }, [streak])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => dismiss(), 5000)
    return () => clearTimeout(id)
  }, [visible])

  function dismiss() {
    setVisible(false)
    if (milestone) {
      try {
        localStorage.setItem(`streak_milestone_${milestone}_seen`, '1')
      } catch {
        // ignore
      }
    }
  }

  if (!visible || !milestone) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm senda-card flex items-center gap-3 animate-card-in"
      role="status"
    >
      <Flame className="h-6 w-6 text-orange-500 shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="senda-heading text-sm">¡Racha de {milestone} días!</p>
        <p className="text-xs" style={{ color: 'var(--d5-body)' }}>Sigue así — la constancia es tu mejor aliada.</p>
      </div>
      <button onClick={dismiss} className="shrink-0 text-[var(--d5-muted)] hover:text-foreground" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
