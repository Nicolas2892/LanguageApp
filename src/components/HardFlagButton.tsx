'use client'

import { useState, useTransition } from 'react'
import { Flag } from 'lucide-react'

interface Props {
  conceptId: string
  initialIsHard: boolean
}

export function HardFlagButton({ conceptId, initialIsHard }: Props) {
  const [isHard, setIsHard] = useState(initialIsHard)
  const [error, setError] = useState(false)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !isHard
    setIsHard(next)
    setError(false)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/concepts/${conceptId}/hard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_hard: next }),
        })
        if (!res.ok) {
          setIsHard(!next)
          setError(true)
          setTimeout(() => setError(false), 3000)
        }
      } catch {
        setIsHard(!next)
        setError(true)
        setTimeout(() => setError(false), 3000)
      }
    })
  }

  return (
    <div className="inline-flex flex-col items-center">
      <button
        type="button"
        onClick={toggle}
        aria-label={isHard ? 'Quitar marca de difícil' : 'Marcar como difícil'}
        className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 rounded-full transition-colors shrink-0
          ${isHard
            ? 'text-[var(--d5-terracotta)] bg-[rgba(196,82,46,0.12)] dark:bg-[rgba(196,82,46,0.15)]'
            : 'text-muted-foreground hover:text-[var(--d5-terracotta)] hover:bg-[rgba(196,82,46,0.10)] dark:hover:bg-[rgba(196,82,46,0.12)]'
          }`}
      >
        <Flag className="h-3.5 w-3.5" fill={isHard ? 'currentColor' : 'none'} />
      </button>
      {error && (
        <span className="text-[0.625rem] text-destructive mt-0.5" role="alert">Error al guardar</span>
      )}
    </div>
  )
}
