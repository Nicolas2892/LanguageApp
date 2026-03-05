'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'tour_dismissed'

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable — skip tour
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      {/* Callout bubble */}
      <div
        className="relative z-10 max-w-sm w-full bg-card border border-border rounded-2xl shadow-xl p-5 space-y-3 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-2xl">👋</div>
          <button
            onClick={dismiss}
            aria-label="Dismiss tour"
            className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div>
          <p className="font-bold text-base">Start here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your first review queue is ready. Tap <span className="font-semibold text-foreground">Start review</span> above to begin spaced repetition — the fastest way to build lasting Spanish.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-95"
        >
          Got it →
        </button>
      </div>
    </div>
  )
}
