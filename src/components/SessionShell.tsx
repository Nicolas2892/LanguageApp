'use client'

import type { ReactNode } from 'react'

interface SessionShellProps {
  children: ReactNode
}

/**
 * Shared layout wrapper for all exercise sessions (grammar, verb, vocab).
 *
 * Mobile (<lg): position fixed, fills viewport, content flows from top.
 * When keyboard opens (interactiveWidget: resizes-content), the container
 * shrinks from the bottom — whitespace below the input is consumed,
 * nothing visible moves.
 *
 * Desktop (lg+): static pass-through, no visual impact.
 */
export function SessionShell({ children }: SessionShellProps) {
  return (
    <div
      className="
        fixed inset-0 z-20 bg-background
        flex flex-col
        overflow-y-auto overscroll-none
        px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)]
        pb-[env(safe-area-inset-bottom,0px)]
        lg:static lg:inset-auto lg:z-auto lg:bg-transparent
        lg:px-0 lg:pt-0 lg:pb-0 lg:overflow-visible
      "
    >
      <div className="relative overflow-hidden flex flex-col flex-1 w-full max-w-2xl mx-auto lg:max-w-none">
        {children}
      </div>
    </div>
  )
}
