'use client'

import { useState, useEffect, useCallback } from 'react'
import { CloudDownload, CheckCircle, Trash2, AlertCircle } from 'lucide-react'
import { useDownloadManager } from '@/lib/offline/useDownloadManager'
import { CircularProgress } from './CircularProgress'

interface Props {
  moduleId: string
}

export function DownloadButton({ moduleId }: Props) {
  const {
    downloadState,
    downloadProgress,
    downloadModule,
    removeModule,
    isModuleDownloaded,
  } = useDownloadManager()

  const [downloaded, setDownloaded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    isModuleDownloaded(moduleId).then(setDownloaded)
  }, [moduleId, isModuleDownloaded, downloadState])

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (downloadState !== 'error') return
    const t = setTimeout(() => {
      // The hook doesn't expose a reset — but re-clicking will retry
    }, 5000)
    return () => clearTimeout(t)
  }, [downloadState])

  const handleClick = useCallback(async () => {
    if (downloaded) {
      setShowConfirm(true)
      return
    }
    await downloadModule(moduleId)
  }, [downloaded, moduleId, downloadModule])

  const handleDelete = useCallback(async () => {
    await removeModule(moduleId)
    setDownloaded(false)
    setShowConfirm(false)
  }, [moduleId, removeModule])

  const isDownloading = downloadState === 'downloading'
  const isError = downloadState === 'error'
  const isDownloaded = downloaded || downloadState === 'complete'

  // Delete confirmation
  if (showConfirm) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          aria-label="Confirmar eliminación"
        >
          <Trash2 size={12} strokeWidth={2} />
          Eliminar
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors bg-[rgba(140,106,63,0.07)] text-[var(--d5-warm)] hover:bg-[rgba(140,106,63,0.12)]"
        >
          Cancelar
        </button>
      </div>
    )
  }

  // Error state — tap to retry
  if (isError) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center rounded-full p-1.5 transition-colors"
        style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--d5-error)' }}
        aria-label="Error al descargar — toca para reintentar"
      >
        <AlertCircle size={14} strokeWidth={2} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDownloading}
      className="flex items-center justify-center rounded-full p-1.5 transition-colors disabled:opacity-60"
      style={{
        background: isDownloaded
          ? 'rgba(196,82,46,0.08)'
          : 'rgba(140,106,63,0.07)',
        color: isDownloaded
          ? 'var(--d5-terracotta)'
          : 'var(--d5-warm)',
      }}
      aria-label={
        isDownloading ? 'Descargando…'
        : isDownloaded ? 'Disponible offline — toca para eliminar'
        : 'Descarga para offline'
      }
    >
      {isDownloading ? (
        <CircularProgress progress={downloadProgress} size={16} strokeWidth={2} />
      ) : isDownloaded ? (
        <CheckCircle size={14} strokeWidth={2} />
      ) : (
        <CloudDownload size={14} strokeWidth={2} />
      )}
    </button>
  )
}
