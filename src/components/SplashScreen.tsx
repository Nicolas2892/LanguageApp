'use client'

import { useState, useEffect } from 'react'
import { storage } from '@/lib/platform/storage'
import { S_STROKE_PATH } from '@/components/SvgSendaPath'

// S-trail path — scaled to fill a large viewBox (same as BackgroundMagicS)
const S_TRAIL_PATH = 'M 80 230 C 20 220, 0 185, 28 158 C 56 131, 130 138, 158 110 C 186 82, 192 42, 158 20'

// Bump version to re-show splash after major brand changes
const STORAGE_KEY = 'senda-splash-v2'

function hasSeenSplash(): boolean {
  return storage.get(STORAGE_KEY) === '1'
}

function markSplashShown(): void {
  storage.set(STORAGE_KEY, '1')
}

export function SplashScreen() {
  const [phase, setPhase] = useState<'animate' | 'fading' | 'done'>(() =>
    hasSeenSplash() ? 'done' : 'animate'
  )

  useEffect(() => {
    if (phase === 'done') return

    markSplashShown()

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fadeDelay = prefersReduced ? 600 : 1600
    const unmountDelay = prefersReduced ? 1100 : 2200

    const fadeTimer = setTimeout(() => setPhase('fading'), fadeDelay)
    const doneTimer = setTimeout(() => setPhase('done'), unmountDelay)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'done') return null

  return (
    <div
      data-testid="splash-screen"
      className={`splash-auto-hide${phase === 'fading' ? ' splash-fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        pointerEvents: phase === 'fading' ? 'none' : undefined,
      }}
    >
      {/* Vellum noise texture */}
      <div className="splash-vellum" />

      {/* Primary S-trail — fills the viewport */}
      <svg
        viewBox="0 0 200 260"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      >
        <path
          d={S_TRAIL_PATH}
          stroke="var(--d5-magic-stroke)"
          strokeWidth={44}
          strokeLinecap="round"
          fill="none"
          className="splash-trail-draw"
        />
      </svg>

      {/* Echo trail — thinner, lower opacity, slightly delayed */}
      <svg
        viewBox="0 0 200 260"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      >
        <path
          d={S_TRAIL_PATH}
          stroke="var(--d5-magic-stroke)"
          strokeWidth={22}
          strokeLinecap="round"
          fill="none"
          className="splash-trail-echo"
        />
      </svg>

      {/* Logo group — S monogram (stroked) + wordmark */}
      <div
        className="splash-logo-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          zIndex: 1,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={80}
          height={80}
          fill="none"
          aria-hidden="true"
        >
          <path d={S_STROKE_PATH} stroke="var(--d5-terracotta)" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
        <span
          className="senda-heading"
          style={{ fontSize: '2.5rem', letterSpacing: '0.02em' }}
        >
          Senda
        </span>
      </div>
    </div>
  )
}
