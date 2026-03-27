'use client'

import { useState, useEffect } from 'react'
import { storage } from '@/lib/platform/storage'
// S-trail path — calligraphic filled, scaled to 200×260 viewBox (same as BackgroundMagicS)
const S_TRAIL_PATH = 'M 57 242 C 24 230, 5 195, 14 161 C 24 126, 52 115, 86 103 C 119 92, 152 80, 171 57 C 185 40, 181 17, 162 17 C 157 17, 160 29, 166 34 C 181 23, 200 34, 195 63 C 190 92, 162 109, 128 121 C 95 132, 62 138, 43 161 C 24 184, 29 218, 52 230 C 67 239, 71 230, 57 242 Z'

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

      {/* Calligraphic S watermark — fades in behind logo */}
      <svg
        viewBox="0 0 200 260"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
        className="splash-trail-draw"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <path
          d={S_TRAIL_PATH}
          fill="var(--d5-magic-stroke)"
          opacity={0.1}
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
          <path d="M 6 21 C 2.5 20, 0.5 17, 1.5 14 C 2.5 11, 5.5 10, 9 9 C 12.5 8, 16 7, 18 5 C 19.5 3.5, 19 1.5, 17 1.5 C 16.5 1.5, 16.8 2.5, 17.5 3 C 19 2, 21 3, 20.5 5.5 C 20 8, 17 9.5, 13.5 10.5 C 10 11.5, 6.5 12, 4.5 14 C 2.5 16, 3 19, 5.5 20 C 7 20.8, 7.5 20, 6 21 Z" fill="var(--d5-terracotta)" />
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
