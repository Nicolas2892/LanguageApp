'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'tour_dismissed'

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="absolute inset-0 bg-[#1A1108]/20 backdrop-blur-sm" aria-hidden="true" />

      {/* Callout bubble */}
      <div
        className="relative z-10 max-w-sm w-full bg-[var(--d5-paper)] dark:bg-[#241910] rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: '0 20px 40px -10px rgba(26, 17, 8, 0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-2xl">👋</div>
          <button
            onClick={dismiss}
            aria-label="Dismiss tour"
            className="text-[var(--d5-muted)] hover:text-[var(--d5-ink)] dark:hover:text-[var(--d5-paper)] transition-colors ml-auto"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div>
          <p className="font-bold text-base text-[var(--d5-ink)] dark:text-[var(--d5-paper)]" style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic' }}>You&apos;re set up.</p>
          <p className="text-sm text-[var(--d5-muted)] mt-1">
            Your first exercises are ready — hit <span className="font-semibold text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">Start review</span> and the app takes care of the rest. No planning, just practice.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Got it →
        </button>
      </div>
    </div>
  )
}
