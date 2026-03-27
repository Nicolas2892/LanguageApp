'use client'

import { useCallback } from 'react'
import { CloudDownload, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react'
import { useDownloadAll } from '@/lib/offline/useDownloadAll'

interface Props {
  modules: Array<{ id: string; title: string }>
  onComplete?: () => void
}

export function DownloadAllButton({ modules, onComplete }: Props) {
  const { state, downloadAll, cancel, reset } = useDownloadAll()

  const handleDownload = useCallback(async () => {
    await downloadAll(modules)
    onComplete?.()
  }, [downloadAll, modules, onComplete])

  if (state.phase === 'complete') {
    const allSkipped = state.skippedModules === state.totalModules
    return (
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 mb-3"
        style={{
          background: 'rgba(196,82,46,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)' }} />
          <div>
            <p className="text-sm font-medium text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">
              {allSkipped ? 'Todo disponible offline' : 'Todo descargado'}
            </p>
            {state.failedModules > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--d5-muted)' }}>
                {state.failedModules} módulo(s) no se pudieron descargar
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full p-1.5 transition-colors hover:bg-[rgba(140,106,63,0.08)]"
          aria-label="Cerrar"
        >
          <X size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
        </button>
      </div>
    )
  }

  if (state.phase === 'downloading') {
    const progress = state.totalModules > 0
      ? Math.round((state.completedModules / state.totalModules) * 100)
      : 0
    return (
      <div className="rounded-xl px-4 py-3 mb-3" style={{ background: 'rgba(140,106,63,0.05)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin" style={{ color: 'var(--d5-terracotta)' }} />
            <p className="text-sm font-medium text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">
              Descargando {state.completedModules}/{state.totalModules}…
            </p>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="rounded-full p-1.5 transition-colors hover:bg-[rgba(140,106,63,0.08)]"
            aria-label="Cancelar descarga"
          >
            <X size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
          </button>
        </div>
        {state.currentModuleTitle && (
          <p className="text-xs mb-2" style={{ color: 'var(--d5-muted)' }}>
            {state.currentModuleTitle}
          </p>
        )}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(140,106,63,0.10)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: 'var(--d5-terracotta)',
            }}
          />
        </div>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div className="rounded-xl px-4 py-3 mb-3" style={{ background: 'rgba(239,68,68,0.06)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <AlertTriangle size={16} strokeWidth={1.5} className="text-red-500" />
          <p className="text-sm font-medium text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">
            {state.error ?? 'La descarga falló'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="text-xs font-medium rounded-full px-3 py-1.5 transition-colors"
          style={{
            color: 'var(--d5-terracotta)',
            background: 'rgba(196,82,46,0.08)',
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  // Idle state
  return (
    <button
      type="button"
      onClick={handleDownload}
      className="senda-focus-ring w-full rounded-xl flex items-center gap-3 text-left border-none cursor-pointer transition-[background] duration-200 ease-out bg-[rgba(196,82,46,0.05)] dark:bg-[rgba(196,82,46,0.10)] mb-3"
      style={{
        padding: '0.75rem',
        boxShadow: '0 10px 30px -10px rgba(26,17,8,0.06)',
      }}
    >
      <CloudDownload size={16} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--d5-terracotta)' }} />
      <div>
        <p className="text-sm font-medium text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">
          Descargar Todo para Offline
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--d5-muted)' }}>
          {modules.length} módulos · Todo el currículo
        </p>
      </div>
    </button>
  )
}
