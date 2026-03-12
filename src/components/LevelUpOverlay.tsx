'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LEVEL_CHIP } from '@/lib/constants'

const LEVEL_ORDER = ['B1', 'B2', 'C1']
const LS_KEY = 'last_known_level'

interface Props {
  currentLevel: string | null
}

export function LevelUpOverlay({ currentLevel }: Props) {
  const [open, setOpen] = useState(false)
  const [levelLabel, setLevelLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!currentLevel) return
    try {
      const stored = localStorage.getItem(LS_KEY)
      const currentIdx = LEVEL_ORDER.indexOf(currentLevel)
      const storedIdx = stored ? LEVEL_ORDER.indexOf(stored) : -1

      // Save immediately to prevent re-trigger
      localStorage.setItem(LS_KEY, currentLevel)

      if (stored && currentIdx > storedIdx) {
        setLevelLabel(currentLevel)
        setOpen(true)
        import('canvas-confetti')
          .then(({ default: confetti }) => {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
          })
          .catch(() => {})
      }
    } catch {
      // localStorage unavailable
    }
  }, [currentLevel])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => setOpen(false), 6000)
    return () => clearTimeout(id)
  }, [open])

  if (!levelLabel) return null

  const chip = LEVEL_CHIP[levelLabel]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader className="items-center gap-3">
          {chip && (
            <span className={`text-lg font-bold px-4 py-1.5 rounded-full ${chip.className}`}>
              {chip.label}
            </span>
          )}
          <DialogTitle className="senda-heading text-xl">¡Subiste a {levelLabel}!</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: 'var(--d5-body)' }}>
          Tu progreso constante te ha llevado al siguiente nivel. ¡Sigue así!
        </p>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
