'use client'

import { useState, useEffect } from 'react'
import { Share2, PlusSquare, Smartphone } from 'lucide-react'

export function IOSInstallCard() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

    const isSafari =
      /safari/i.test(navigator.userAgent) &&
      !/crios|fxios|opios|edgios/i.test(navigator.userAgent)

    const isStandalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIOS && isSafari && !isStandalone) setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-orange-500 shrink-0" />
        <p className="text-sm font-semibold">Install on your iPhone</p>
      </div>
      <p className="text-sm text-muted-foreground">Open in Safari, then:</p>
      <ol className="space-y-2">
        <li className="flex items-center gap-3 text-sm">
          <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Share2 className="h-3.5 w-3.5 text-orange-600" />
          </span>
          Tap <strong>Share</strong> in Safari&apos;s toolbar
        </li>
        <li className="flex items-center gap-3 text-sm">
          <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <PlusSquare className="h-3.5 w-3.5 text-orange-600" />
          </span>
          Tap <strong>Add to Home Screen</strong>
        </li>
      </ol>
    </div>
  )
}
