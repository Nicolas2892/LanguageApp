'use client'

import { useState, useCallback } from 'react'
import {
  putDownloadedModule,
  putExercises,
  putConcepts,
  putUnits,
  putUserProgress,
  putFreeWritePrompts,
  deleteModuleData,
  getAllDownloadedModules,
  isModuleDownloaded as checkModuleDownloaded,
} from './db'
import type {
  DownloadedModule,
  OfflineExercise,
  OfflineConcept,
  OfflineUnit,
  OfflineUserProgress,
  OfflineFreeWritePrompt,
} from './types'

export type DownloadState = 'idle' | 'downloading' | 'complete' | 'error'

interface ModuleBundleResponse {
  module: { id: string; title: string; order_index: number }
  units: Array<{ id: string; module_id: string; title: string; order_index: number }>
  concepts: Array<{
    id: string; unit_id: string; type: string; title: string; explanation: string;
    examples: unknown; difficulty: number; level: string; grammar_focus: string | null
  }>
  exercises: Array<{
    id: string; concept_id: string; type: string; prompt: string;
    expected_answer: string | null; answer_variants: unknown | null;
    hint_1: string | null; hint_2: string | null; annotations: unknown | null;
    source: 'seed' | 'ai_generated'
  }>
  user_progress: Array<{
    concept_id: string; ease_factor: number; interval_days: number;
    due_date: string; repetitions: number; production_mastered: boolean; is_hard: boolean
  }>
  free_write_prompts: Array<{ concept_id: string; prompt: string }>
  version: number
}

export function useDownloadManager() {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const downloadModule = useCallback(async (moduleId: string) => {
    setDownloadState('downloading')
    setDownloadProgress(10)
    setError(null)

    try {
      const res = await fetch(`/api/offline/module/${moduleId}`)
      if (!res.ok) {
        throw new Error(`Download failed: ${res.status}`)
      }
      setDownloadProgress(50)

      const bundle = (await res.json()) as ModuleBundleResponse

      // Write to IDB
      const { module: mod, units, concepts, exercises, user_progress, free_write_prompts, version } = bundle

      // Map exercises to include module_id (denormalised for IDB index)
      const conceptToModule = new Map(concepts.map(c => {
        const unit = units.find(u => u.id === c.unit_id)
        return [c.id, unit?.module_id ?? moduleId]
      }))

      const offlineExercises: OfflineExercise[] = exercises.map(e => ({
        ...e,
        module_id: conceptToModule.get(e.concept_id) ?? moduleId,
        answer_variants: Array.isArray(e.answer_variants) ? e.answer_variants as string[] : null,
      }))

      const offlineConcepts: OfflineConcept[] = concepts.map(c => ({
        ...c,
        module_id: units.find(u => u.id === c.unit_id)?.module_id ?? moduleId,
      }))

      const offlineUnits: OfflineUnit[] = units.map(u => ({
        id: u.id,
        module_id: u.module_id,
        title: u.title,
        order_index: u.order_index,
      }))

      const offlineProgress: OfflineUserProgress[] = user_progress

      const offlinePrompts: OfflineFreeWritePrompt[] = free_write_prompts.filter(p => p.prompt)

      setDownloadProgress(70)

      await putUnits(offlineUnits)
      await putConcepts(offlineConcepts)
      await putExercises(offlineExercises)
      await putUserProgress(offlineProgress)
      await putFreeWritePrompts(offlinePrompts)

      setDownloadProgress(90)

      const downloadedModule: DownloadedModule = {
        module_id: mod.id,
        title: mod.title,
        order_index: mod.order_index,
        downloaded_at: new Date().toISOString(),
        exercise_count: exercises.length,
        concept_count: concepts.length,
        version,
      }
      await putDownloadedModule(downloadedModule)

      setDownloadProgress(100)
      setDownloadState('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
      setDownloadState('error')
    }
  }, [])

  const removeModule = useCallback(async (moduleId: string) => {
    await deleteModuleData(moduleId)
    setDownloadState('idle')
    setDownloadProgress(0)
  }, [])

  const getDownloadedModules = useCallback(async (): Promise<DownloadedModule[]> => {
    return getAllDownloadedModules()
  }, [])

  const isModuleDownloaded = useCallback(async (moduleId: string): Promise<boolean> => {
    return checkModuleDownloaded(moduleId)
  }, [])

  return {
    downloadState,
    downloadProgress,
    error,
    downloadModule,
    removeModule,
    getDownloadedModules,
    isModuleDownloaded,
  }
}
