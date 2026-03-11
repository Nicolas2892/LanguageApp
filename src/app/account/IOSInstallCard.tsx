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
    <div className="rounded-xl p-5 space-y-3" style={{ boxShadow: '0 10px 30px -10px rgba(26,17,8,0.08)', background: 'rgba(196,82,46,0.03)' }}>
      <div className="flex items-center gap-2">
        <Smartphone size={16} strokeWidth={1.5} style={{ color: 'var(--d5-ink)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--d5-ink)' }}>Instalar en tu iPhone</p>
      </div>
      <p style={{ fontSize: 12, color: 'var(--d5-muted)' }}>Ábrelo en Safari, luego:</p>
      <ol className="space-y-2">
        <li className="flex items-center gap-3" style={{ fontSize: 12, color: 'var(--d5-ink)' }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(196,82,46,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Share2 size={13} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)' }} />
          </span>
          Toca <strong>Compartir</strong> en la barra de Safari
        </li>
        <li className="flex items-center gap-3" style={{ fontSize: 12, color: 'var(--d5-ink)' }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(196,82,46,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlusSquare size={13} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)' }} />
          </span>
          Toca <strong>Añadir a pantalla de inicio</strong>
        </li>
      </ol>
    </div>
  )
}
