'use client'

import { useState, useEffect } from 'react'
import {
  getCachedProfile,
  getDashboardCache,
  getAllCachedModules,
  getAllDownloadedModules,
  getAllConcepts,
  getAllUserProgress,
  getAllCachedVerbs,
  getAllCachedVerbFavorites,
  getAllCachedVerbProgress,
  getAllCachedVerbConjugations,
} from './db'
import type {
  CachedProfile,
  CachedDashboardStats,
  CachedModule,
  DownloadedModule,
  OfflineConcept,
  OfflineUserProgress,
  CachedVerb,
  CachedVerbFavorite,
  CachedVerbProgress,
  CachedVerbConjugation,
} from './types'

// ── Generic IDB hook ──────────────────────────────────────────────────

function useIDB<T>(fetcher: () => Promise<T>): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((result) => { if (!cancelled) setData(result) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading }
}

// ── Profile ────────────────────────────────────────────────────────────

export function useOfflineProfile() {
  return useIDB<CachedProfile | undefined>(getCachedProfile)
}

// ── Dashboard ──────────────────────────────────────────────────────────

interface OfflineDashboardData {
  profile: CachedProfile | undefined
  stats: CachedDashboardStats | undefined
  downloadedModules: DownloadedModule[]
}

export function useOfflineDashboard() {
  return useIDB<OfflineDashboardData>(async () => {
    const [profile, stats, downloadedModules] = await Promise.all([
      getCachedProfile(),
      getDashboardCache(),
      getAllDownloadedModules(),
    ])
    return { profile, stats, downloadedModules }
  })
}

// ── Curriculum ─────────────────────────────────────────────────────────

interface OfflineCurriculumData {
  modules: CachedModule[]
  concepts: OfflineConcept[]
  progress: OfflineUserProgress[]
}

export function useOfflineCurriculum() {
  return useIDB<OfflineCurriculumData>(async () => {
    const [modules, concepts, progress] = await Promise.all([
      getAllCachedModules(),
      getAllConcepts(),
      getAllUserProgress(),
    ])
    return { modules, concepts, progress }
  })
}

// ── Verbs ──────────────────────────────────────────────────────────────

interface OfflineVerbsData {
  verbs: CachedVerb[]
  favorites: CachedVerbFavorite[]
  progress: CachedVerbProgress[]
}

export function useOfflineVerbs() {
  return useIDB<OfflineVerbsData>(async () => {
    const [verbs, favorites, progress] = await Promise.all([
      getAllCachedVerbs(),
      getAllCachedVerbFavorites(),
      getAllCachedVerbProgress(),
    ])
    return { verbs, favorites, progress }
  })
}

// ── Verb detail ────────────────────────────────────────────────────────

interface OfflineVerbDetailData {
  verb: CachedVerb | undefined
  conjugations: CachedVerbConjugation[]
  favorited: boolean
  progress: CachedVerbProgress[]
}

export function useOfflineVerbDetail(infinitive: string) {
  return useIDB<OfflineVerbDetailData>(async () => {
    const [verbs, allConj, favorites, allProgress] = await Promise.all([
      getAllCachedVerbs(),
      getAllCachedVerbConjugations(),
      getAllCachedVerbFavorites(),
      getAllCachedVerbProgress(),
    ])

    const verb = verbs.find((v) => v.infinitive === infinitive)
    const verbId = verb?.id

    return {
      verb,
      conjugations: verbId ? allConj.filter((c) => c.verb_id === verbId) : [],
      favorited: verbId ? favorites.some((f) => f.verb_id === verbId) : false,
      progress: verbId ? allProgress.filter((p) => p.verb_id === verbId) : [],
    }
  })
}

// ── Progress ───────────────────────────────────────────────────────────

interface OfflineProgressData {
  profile: CachedProfile | undefined
  concepts: OfflineConcept[]
  progress: OfflineUserProgress[]
  verbProgress: CachedVerbProgress[]
}

export function useOfflineProgress() {
  return useIDB<OfflineProgressData>(async () => {
    const [profile, concepts, progress, verbProgress] = await Promise.all([
      getCachedProfile(),
      getAllConcepts(),
      getAllUserProgress(),
      getAllCachedVerbProgress(),
    ])
    return { profile, concepts, progress, verbProgress }
  })
}
