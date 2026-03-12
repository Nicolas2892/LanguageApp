'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { SvgSendaPath } from '@/components/SvgSendaPath'

const LS_KEY = 'welcome_seen'

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === '1'
  } catch {
    return true
  }
}
function getServerSnapshot(): boolean { return true }
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

interface Props {
  children: ReactNode
}

export function WelcomeScreen({ children }: Props) {
  const seenInStorage = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [dismissed, setDismissed] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  const seen = seenInStorage || dismissed

  function handleStart() {
    setFadingOut(true)
    try {
      localStorage.setItem(LS_KEY, '1')
    } catch {
      // ignore
    }
    setTimeout(() => setDismissed(true), 300)
  }

  if (seen) return <>{children}</>

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <div className="relative overflow-hidden text-center px-8 py-16 max-w-sm space-y-6">
        <BackgroundMagicS opacity={0.06} />
        <div className="flex justify-center">
          <SvgSendaPath size={64} strokeWidth={4} />
        </div>
        <h1 className="senda-heading text-3xl">Senda</h1>
        <p className="text-sm" style={{ color: 'var(--d5-body)' }}>
          Tu camino al español avanzado
        </p>
        <button onClick={handleStart} className="senda-cta">
          Empezar →
        </button>
      </div>
    </div>
  )
}
