'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, HardDrive, CloudOff } from 'lucide-react'
import {
  getAllDownloadedModules,
  getStorageStats,
  clearAllOfflineData,
  deleteModuleData,
} from '@/lib/offline/db'
import type { DownloadedModule } from '@/lib/offline/types'
import type { StorageStats } from '@/lib/offline/db'

export function OfflineStorageManager() {
  const [modules, setModules] = useState<DownloadedModule[]>([])
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [clearing, setClearing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [mods, st] = await Promise.all([
        getAllDownloadedModules(),
        getStorageStats(),
      ])
      setModules(mods)
      setStats(st)
    } catch {
      // IDB not available
    }
  }, [])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const [mods, st] = await Promise.all([
          getAllDownloadedModules(),
          getStorageStats(),
        ])
        if (!ignore) {
          setModules(mods)
          setStats(st)
        }
      } catch {
        // IDB not available
      }
    })()
    return () => { ignore = true }
  }, [])

  const handleDeleteModule = async (moduleId: string) => {
    await deleteModuleData(moduleId)
    await refresh()
  }

  const handleClearAll = async () => {
    setClearing(true)
    await clearAllOfflineData()
    await refresh()
    setClearing(false)
  }

  const hasData = (stats?.downloadedModuleCount ?? 0) > 0 ||
    (stats?.verbCacheCount ?? 0) > 0 ||
    (stats?.queuedAttemptCount ?? 0) > 0

  if (!hasData) {
    return (
      <div className="flex items-center gap-3 rounded-xl py-3" style={{ color: 'var(--d5-muted)' }}>
        <CloudOff size={16} strokeWidth={1.5} className="shrink-0" />
        <p className="text-sm">No hay datos offline almacenados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Downloaded modules */}
      {modules.map(mod => (
        <div
          key={mod.module_id}
          className="flex items-center justify-between rounded-xl bg-[rgba(140,106,63,0.04)] dark:bg-[rgba(184,170,153,0.06)] px-3 py-2.5"
        >
          <div>
            <p className="text-sm font-medium text-[var(--d5-ink)] dark:text-[var(--d5-paper)]">
              {mod.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--d5-muted)' }}>
              {mod.exercise_count} ejercicios · {mod.concept_count} conceptos
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDeleteModule(mod.module_id)}
            className="rounded-full p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label={`Eliminar ${mod.title}`}
          >
            <Trash2 size={14} strokeWidth={1.5} className="text-red-500 dark:text-red-400" />
          </button>
        </div>
      ))}

      {/* Stats summary */}
      {stats && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--d5-muted)' }}>
          <HardDrive size={12} strokeWidth={1.5} />
          <span>
            {stats.exerciseCount} ejercicios · {stats.verbCacheCount} verbos · {stats.queuedAttemptCount} respuestas pendientes
          </span>
        </div>
      )}

      {/* Clear all */}
      <button
        type="button"
        onClick={handleClearAll}
        disabled={clearing}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
      >
        <Trash2 size={12} strokeWidth={2} />
        {clearing ? 'Eliminando…' : 'Eliminar todo'}
      </button>
    </div>
  )
}
