'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  verbId: string
  initialFavorited: boolean
  size?: 'sm' | 'md'
}

export function VerbFavoriteButton({ verbId, initialFavorited, size = 'sm' }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    // Optimistic update
    setFavorited((prev) => !prev)

    try {
      const res = await fetch('/api/verbs/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verb_id: verbId }),
      })
      if (!res.ok) {
        // Revert on failure
        setFavorited((prev) => !prev)
      } else {
        const data = await res.json() as { favorited: boolean }
        setFavorited(data.favorited)
      }
    } catch {
      setFavorited((prev) => !prev)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggle() }}
      disabled={loading}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'rounded-full transition-colors touch-manipulation',
        size === 'sm' ? 'p-1.5' : 'p-2',
        favorited
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-muted-foreground hover:text-rose-400',
      )}
    >
      <Heart
        className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')}
        fill={favorited ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  )
}
