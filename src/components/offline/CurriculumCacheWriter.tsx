'use client'

import { useEffect } from 'react'
import { putCachedModules, putConcepts, putUnits, putUserProgress } from '@/lib/offline/db'
import type { CachedModule, OfflineConcept, OfflineUnit, OfflineUserProgress } from '@/lib/offline/types'

interface Props {
  modules: Array<{ id: string; title: string; order_index: number }>
  units: Array<{ id: string; module_id: string; title: string; order_index: number }>
  concepts: Array<{ id: string; unit_id: string; title: string; difficulty: number; level: string | null; grammar_focus: string | null }>
  progressEntries: Array<{ concept_id: string; interval_days: number; is_hard: boolean; production_mastered: boolean }>
}

/**
 * Silent component that writes full curriculum data to IDB on mount.
 * Supplements Feat-F per-module downloads with complete curriculum tree.
 */
export function CurriculumCacheWriter({ modules, units, concepts, progressEntries }: Props) {
  useEffect(() => {
    async function writeCache() {
      const cachedModules: CachedModule[] = modules.map((m) => ({
        id: m.id,
        title: m.title,
        order_index: m.order_index,
      }))
      await putCachedModules(cachedModules)

      // We need module_id on concepts — derive from unit_id → module_id map
      const unitModuleMap = new Map(units.map((u) => [u.id, u.module_id]))

      const offlineUnits: OfflineUnit[] = units.map((u) => ({
        id: u.id,
        module_id: u.module_id,
        title: u.title,
        order_index: u.order_index,
      }))
      await putUnits(offlineUnits)

      const offlineConcepts: OfflineConcept[] = concepts.map((c) => ({
        id: c.id,
        module_id: unitModuleMap.get(c.unit_id) ?? '',
        unit_id: c.unit_id,
        type: '',
        title: c.title,
        explanation: '',
        examples: null,
        difficulty: c.difficulty,
        level: c.level ?? '',
        grammar_focus: c.grammar_focus,
      }))
      await putConcepts(offlineConcepts)

      const offlineProgress: OfflineUserProgress[] = progressEntries.map((p) => ({
        concept_id: p.concept_id,
        ease_factor: 2.5,
        interval_days: p.interval_days,
        due_date: '',
        repetitions: 0,
        production_mastered: p.production_mastered,
        is_hard: p.is_hard,
      }))
      await putUserProgress(offlineProgress)
    }

    writeCache().catch(() => {})
  }, [modules, units, concepts, progressEntries])

  return null
}
