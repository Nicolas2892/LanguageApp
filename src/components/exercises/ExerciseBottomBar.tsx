'use client'

import type { ReactNode } from 'react'

interface ExerciseBottomBarProps {
  children: ReactNode
}

/**
 * Fixed bottom bar container for grammar exercise input portals.
 * Mobile (<lg): pinned above keyboard. Desktop: never rendered (exercises render inline).
 */
export function ExerciseBottomBar({ children }: ExerciseBottomBarProps) {
  return (
    <div
      className="
        fixed bottom-0 inset-x-0 z-30
        bg-background border-t border-border
        px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]
      "
    >
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  )
}
