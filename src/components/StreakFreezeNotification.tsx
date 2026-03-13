'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface Props {
  freezeUsedDate: string | null
  streak: number
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function StreakFreezeNotification({ freezeUsedDate, streak }: Props) {
  const [visible, setVisible] = useState(false)

  const dismiss = useCallback(() => {
    setVisible(false)
    if (freezeUsedDate) {
      try {
        localStorage.setItem(`streak_freeze_used_${freezeUsedDate}`, '1')
      } catch {
        // ignore
      }
    }
  }, [freezeUsedDate])

  useEffect(() => {
    if (!freezeUsedDate || streak <= 0) return
    if (freezeUsedDate !== getYesterday()) return

    const key = `streak_freeze_used_${freezeUsedDate}`
    try {
      if (localStorage.getItem(key)) return
      setVisible(true)
    } catch {
      // localStorage unavailable
    }
  }, [freezeUsedDate, streak])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => dismiss(), 6000)
    return () => clearTimeout(id)
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm senda-card flex items-center gap-3 animate-card-in"
      role="status"
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--d5-terracotta)"
        strokeWidth={2}
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="senda-heading text-sm">¡Tu racha fue protegida!</p>
        <p className="text-xs" style={{ color: 'var(--d5-body)' }}>
          Usaste tu protección semanal. Se renueva en 7 días.
        </p>
      </div>
      <button onClick={dismiss} className="shrink-0 text-[var(--d5-muted)] hover:text-foreground" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
