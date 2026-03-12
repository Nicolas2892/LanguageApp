'use client'

import { useState, useTransition } from 'react'
import { Flag } from 'lucide-react'

interface Props {
  conceptId: string
  initialIsHard: boolean
}

export function HardFlagButton({ conceptId, initialIsHard }: Props) {
  const [isHard, setIsHard] = useState(initialIsHard)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !isHard
    setIsHard(next)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/concepts/${conceptId}/hard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_hard: next }),
        })
        if (!res.ok) {
          setIsHard(!next)
        }
      } catch {
        setIsHard(!next)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isHard ? 'Quitar marca de difícil' : 'Marcar como difícil'}
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 rounded-full transition-colors shrink-0
        ${isHard
          ? 'text-orange-500 bg-orange-100 dark:bg-orange-950/40'
          : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950/40'
        }`}
    >
      <Flag className="h-3.5 w-3.5" fill={isHard ? 'currentColor' : 'none'} />
    </button>
  )
}
