'use client'

import { useEffect, useRef } from 'react'
import {
  putVerbCache,
  putVerbSentences,
  putVerbConjugations,
  putVerbFavorites,
  putVerbProgress,
  setVerbCacheMeta,
  getVerbCacheMeta,
} from '@/lib/offline/db'
import type {
  CachedVerb,
  CachedVerbSentence,
  CachedVerbConjugation,
  CachedVerbFavorite,
  CachedVerbProgress,
} from '@/lib/offline/types'

interface VerbBundleResponse {
  verbs: CachedVerb[]
  verb_sentences: CachedVerbSentence[]
  verb_conjugations: CachedVerbConjugation[]
  user_favorites: string[]
  user_progress: CachedVerbProgress[]
  version: number
}

/**
 * Silent background component that auto-caches verb data to IDB.
 * Mounted in layout.tsx when user is authenticated.
 * No UI — completely invisible.
 */
export function VerbCacheManager() {
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    cacheVerbs()
  }, [])

  return null
}

async function cacheVerbs() {
  try {
    // Check if we already have a fresh cache
    const existingVersion = await getVerbCacheMeta('version')

    // Fetch with version param for 304 support
    const url = existingVersion
      ? `/api/offline/verbs?version=${existingVersion}`
      : '/api/offline/verbs'

    const res = await fetch(url)

    // 304 = cache is still fresh
    if (res.status === 304) return

    if (!res.ok) return

    const bundle = (await res.json()) as VerbBundleResponse

    // Write all data to IDB
    await putVerbCache(bundle.verbs)
    await putVerbSentences(bundle.verb_sentences)
    await putVerbConjugations(bundle.verb_conjugations)
    await putVerbFavorites(
      bundle.user_favorites.map(id => ({ verb_id: id }) satisfies CachedVerbFavorite),
    )
    await putVerbProgress(bundle.user_progress)
    await setVerbCacheMeta('version', String(bundle.version))
  } catch {
    // Silent failure — verb cache is optional enhancement
  }
}
