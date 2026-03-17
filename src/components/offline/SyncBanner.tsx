'use client'

import { CloudUpload, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSyncManager, type SyncState } from '@/lib/offline/useSyncManager'

/**
 * Sync progress banner. Mounted in layout.tsx.
 * Only visible when there's active sync activity.
 */
export function SyncBanner() {
  const { syncState, syncResult, syncProgress } = useSyncManager()

  if (syncState === 'idle') return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 lg:ml-[220px]"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        className="senda-card mx-4 mt-2 flex items-center gap-3"
        style={{
          padding: '0.625rem 0.875rem',
          boxShadow: '0 4px 20px rgba(26,17,8,0.12)',
          background: 'var(--background)',
        }}
      >
        <SyncIcon state={syncState} />
        <div className="flex-1 min-w-0">
          <SyncMessage state={syncState} syncResult={syncResult} />
          {syncState === 'syncing' && (
            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--d5-surface-tint)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${syncProgress}%`,
                  background: 'var(--d5-terracotta)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SyncIcon({ state }: { state: SyncState }) {
  switch (state) {
    case 'syncing':
      return <CloudUpload size={16} strokeWidth={1.5} className="shrink-0 animate-pulse" style={{ color: 'var(--d5-terracotta)' }} />
    case 'done':
      return <CheckCircle2 size={16} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--d5-terracotta)' }} />
    case 'error':
      return <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 text-red-500" />
    default:
      return null
  }
}

function SyncMessage({ state, syncResult }: { state: SyncState; syncResult: { grammarCount: number; verbCount: number } | null }) {
  switch (state) {
    case 'syncing': {
      const total = (syncResult?.grammarCount ?? 0) + (syncResult?.verbCount ?? 0)
      return (
        <p className="text-xs font-medium" style={{ color: 'var(--d5-ink)' }}>
          Sincronizando{total > 0 ? ` ${total} respuestas` : ''}…
        </p>
      )
    }
    case 'done': {
      const total = (syncResult?.grammarCount ?? 0) + (syncResult?.verbCount ?? 0)
      return (
        <p className="text-xs font-medium" style={{ color: 'var(--d5-terracotta)' }}>
          Sincronización completa — {total} {total === 1 ? 'respuesta' : 'respuestas'}
        </p>
      )
    }
    case 'error':
      return (
        <p className="text-xs font-medium text-red-500">
          Error al sincronizar. Se reintentará automáticamente.
        </p>
      )
    default:
      return null
  }
}
