'use client'

import { useState, useEffect } from 'react'

// BackgroundMagicS path data, rendered larger for the splash trail animation
const S_TRAIL_PATH = 'M 80 230 C 20 220, 0 185, 28 158 C 56 131, 130 138, 158 110 C 186 82, 192 42, 158 20'

// SvgSendaPath monogram path (from SvgSendaPath.tsx)
const S_LOGO_PATH = 'M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2'

export function SplashScreen() {
  const [phase, setPhase] = useState<'animate' | 'fading' | 'done'>('animate')

  useEffect(() => {
    // Check for reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fadeDelay = prefersReduced ? 600 : 1200
    const unmountDelay = prefersReduced ? 1100 : 1700

    const fadeTimer = setTimeout(() => setPhase('fading'), fadeDelay)
    const doneTimer = setTimeout(() => setPhase('done'), unmountDelay)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      data-testid="splash-screen"
      className={phase === 'fading' ? 'splash-fade-out' : ''}
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

      {/* Animated S-trail — draws bottom→up */}
      <svg
        viewBox="0 0 200 260"
        width={160}
        height={208}
        aria-hidden="true"
        style={{ position: 'absolute', opacity: 0.15, pointerEvents: 'none' }}
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

      {/* Logo group — S monogram + wordmark */}
      <div className="splash-logo-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <svg
          viewBox="0 0 24 24"
          width={56}
          height={56}
          fill="none"
          aria-hidden="true"
        >
          <path d={S_LOGO_PATH} stroke="var(--d5-terracotta)" strokeWidth={3} strokeLinecap="round" />
        </svg>
        <span
          className="senda-heading"
          style={{ fontSize: '2rem', letterSpacing: '0.02em' }}
        >
          Senda
        </span>
      </div>

      {/* Footer micro-tag */}
      <span
        style={{
          position: 'absolute',
          bottom: 48,
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--d5-muted)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        }}
      >
        Crafted with Senda
      </span>
    </div>
  )
}
