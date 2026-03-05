'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Share2, PlusSquare, X } from 'lucide-react'

const HIDDEN_ROUTES = ['/auth', '/onboarding']

export function IOSInstallPrompt() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return

    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

    const isSafari =
      /safari/i.test(navigator.userAgent) &&
      !/crios|fxios|opios|edgios/i.test(navigator.userAgent)

    const isStandalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    const dismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true'

    if (isIOS && isSafari && !isStandalone && !dismissed) setVisible(true)
  }, [pathname])

  function handleDismiss() {
    localStorage.setItem('pwa_prompt_dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Install app prompt"
      className="fixed left-4 right-4 z-50 bg-card border border-border/50 rounded-2xl shadow-lg p-5 space-y-3 lg:hidden"
      style={{ bottom: 'calc(3.125rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Install Español Avanzado</p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Add this app to your Home Screen for the best experience — opens instantly, works offline.
      </p>

      <ol className="space-y-2">
        <li className="flex items-center gap-3 text-sm">
          <span className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
            <Share2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
          </span>
          Tap <strong>Share</strong> in Safari&apos;s toolbar
        </li>
        <li className="flex items-center gap-3 text-sm">
          <span className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
            <PlusSquare className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
          </span>
          Tap <strong>Add to Home Screen</strong>
        </li>
      </ol>
    </div>
  )
}
