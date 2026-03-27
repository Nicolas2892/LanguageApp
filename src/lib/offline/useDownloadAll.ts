'use client'

import { useState, useCallback, useRef } from 'react'
import { trackOfflineDownloadAll } from '@/lib/analytics'
import {
  putDownloadedModule,
  putExercises,
  putConcepts,
  putUnits,
  putUserProgress,
  putFreeWritePrompts,
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

export type DownloadAllPhase = 'idle' | 'downloading' | 'complete' | 'error'

export interface DownloadAllState {
  phase: DownloadAllPhase
  completedModules: number
  totalModules: number
  skippedModules: number
  failedModules: number
  currentModuleTitle: string | null
  error: string | null
}

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

const PREFETCH_ROUTES = [
  '/dashboard', '/curriculum', '/progress', '/verbs', '/study', '/study/configure',
  '/pronunciation', '/account', '/tutor', '/vocab/configure', '/verbs/configure',
  '/offline/reports',
]

export function useDownloadAll() {
  const [state, setState] = useState<DownloadAllState>({
    phase: 'idle',
    completedModules: 0,
    totalModules: 0,
    skippedModules: 0,
    failedModules: 0,
    currentModuleTitle: null,
    error: null,
  })

  const abortRef = useRef<AbortController | null>(null)

  const downloadAll = useCallback(async (modules: Array<{ id: string; title: string }>) => {
    const controller = new AbortController()
    abortRef.current = controller
    const startTime = Date.now()

    const total = modules.length
    let completed = 0
    let skipped = 0
    let failed = 0

    setState({
      phase: 'downloading',
      completedModules: 0,
      totalModules: total,
      skippedModules: 0,
      failedModules: 0,
      currentModuleTitle: null,
      error: null,
    })

    // Phase 1: Download modules sequentially
    for (const mod of modules) {
      if (controller.signal.aborted) break

      // Skip already-downloaded modules
      try {
        const alreadyDownloaded = await checkModuleDownloaded(mod.id)
        if (alreadyDownloaded) {
          skipped++
          completed++
          setState(prev => ({
            ...prev,
            completedModules: completed,
            skippedModules: skipped,
          }))
          continue
        }
      } catch {
        // If IDB check fails, try downloading anyway
      }

      setState(prev => ({ ...prev, currentModuleTitle: mod.title }))

      try {
        const res = await fetch(`/api/offline/module/${mod.id}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const bundle = (await res.json()) as ModuleBundleResponse

        // Write to IDB — same logic as useDownloadManager
        const { module: bundleMod, units, concepts, exercises, user_progress, free_write_prompts, version } = bundle

        const conceptToModule = new Map(concepts.map(c => {
          const unit = units.find(u => u.id === c.unit_id)
          return [c.id, unit?.module_id ?? mod.id]
        }))

        const offlineExercises: OfflineExercise[] = exercises.map(e => ({
          ...e,
          module_id: conceptToModule.get(e.concept_id) ?? mod.id,
          answer_variants: Array.isArray(e.answer_variants) ? e.answer_variants as string[] : null,
        }))

        const offlineConcepts: OfflineConcept[] = concepts.map(c => ({
          ...c,
          module_id: units.find(u => u.id === c.unit_id)?.module_id ?? mod.id,
        }))

        const offlineUnits: OfflineUnit[] = units.map(u => ({
          id: u.id, module_id: u.module_id, title: u.title, order_index: u.order_index,
        }))

        const offlineProgress: OfflineUserProgress[] = user_progress
        const offlinePrompts: OfflineFreeWritePrompt[] = free_write_prompts.filter(p => p.prompt)

        await putUnits(offlineUnits)
        await putConcepts(offlineConcepts)
        await putExercises(offlineExercises)
        await putUserProgress(offlineProgress)
        await putFreeWritePrompts(offlinePrompts)

        const downloadedModule: DownloadedModule = {
          module_id: bundleMod.id,
          title: bundleMod.title,
          order_index: bundleMod.order_index,
          downloaded_at: new Date().toISOString(),
          exercise_count: exercises.length,
          concept_count: concepts.length,
          version,
        }
        await putDownloadedModule(downloadedModule)

        completed++
        setState(prev => ({ ...prev, completedModules: completed }))
      } catch (err) {
        if (controller.signal.aborted) break
        failed++
        completed++
        setState(prev => ({
          ...prev,
          completedModules: completed,
          failedModules: failed,
        }))
      }
    }

    if (controller.signal.aborted) {
      setState(prev => ({ ...prev, phase: 'idle', currentModuleTitle: null }))
      return
    }

    // Phase 2: Prefetch app routes (parallel, best-effort)
    setState(prev => ({ ...prev, currentModuleTitle: null }))
    await Promise.allSettled(
      PREFETCH_ROUTES.map(route =>
        fetch(route, { signal: controller.signal }).catch(() => { /* best-effort */ })
      )
    )

    const finalPhase = failed > 0 && failed === total ? 'error' : 'complete'

    setState(prev => ({
      ...prev,
      phase: finalPhase,
      currentModuleTitle: null,
      error: failed > 0 ? `${failed} módulo(s) fallaron` : null,
    }))

    trackOfflineDownloadAll({
      totalModules: total,
      downloadedModules: completed - skipped - failed,
      skippedModules: skipped,
      failedModules: failed,
      durationMs: Date.now() - startTime,
    })
  }, [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState({
      phase: 'idle',
      completedModules: 0,
      totalModules: 0,
      skippedModules: 0,
      failedModules: 0,
      currentModuleTitle: null,
      error: null,
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      completedModules: 0,
      totalModules: 0,
      skippedModules: 0,
      failedModules: 0,
      currentModuleTitle: null,
      error: null,
    })
  }, [])

  return { state, downloadAll, cancel, reset }
}
