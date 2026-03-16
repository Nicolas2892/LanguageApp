'use client'

import { useState, useEffect, useCallback } from 'react'
import { CloudDownload, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { useDownloadManager } from '@/lib/offline/useDownloadManager'

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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDownloading}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60"
      style={{
        background: downloaded
          ? 'rgba(196,82,46,0.08)'
          : 'rgba(140,106,63,0.07)',
        color: downloaded
          ? 'var(--d5-terracotta)'
          : 'var(--d5-warm)',
      }}
      aria-label={downloaded ? 'Disponible offline — toca para eliminar' : 'Descargar para offline'}
    >
      {isDownloading ? (
        <>
          <Loader2 size={12} strokeWidth={2} className="animate-spin" />
          {downloadProgress}%
        </>
      ) : downloaded ? (
        <>
          <CheckCircle size={12} strokeWidth={2} />
          Offline
        </>
      ) : (
        <>
          <CloudDownload size={12} strokeWidth={2} />
          Descargar
        </>
      )}
    </button>
  )
}
