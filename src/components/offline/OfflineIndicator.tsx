'use client'

import { WifiOff } from 'lucide-react'

interface Props {
  cachedAt?: string | null
}

/**
 * Small banner shown in error.tsx offline shells to indicate stale data.
 */
export function OfflineIndicator({ cachedAt }: Props) {
  const timeLabel = cachedAt
    ? new Date(cachedAt).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="senda-card flex items-center gap-3 mb-4" style={{ padding: '0.625rem 0.875rem' }}>
      <WifiOff size={16} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--d5-muted)' }} />
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--d5-ink)' }}>
          Mostrando datos guardados
        </p>
        {timeLabel && (
          <p className="senda-eyebrow" style={{ marginTop: 2 }}>
            Guardado {timeLabel}
          </p>
        )}
      </div>
    </div>
  )
}
