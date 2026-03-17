import { openDB, type IDBPDatabase } from 'idb'
import type {
  DownloadedModule,
  OfflineExercise,
  OfflineConcept,
  OfflineUnit,
  OfflineUserProgress,
  OfflineFreeWritePrompt,
  QueuedAttempt,
  QueuedVerbAttempt,
  OfflineSession,
  CachedVerb,
  CachedVerbSentence,
  CachedVerbConjugation,
  CachedVerbFavorite,
  CachedVerbProgress,
  VerbCacheMeta,
} from './types'

// ── DB name & version ─────────────────────────────────────────────────

const DB_NAME = 'senda-offline'
const DB_VERSION = 1

// ── Store names ───────────────────────────────────────────────────────

const STORES = {
  downloadedModules: 'downloaded_modules',
  exercises: 'exercises',
  concepts: 'concepts',
  units: 'units',
  userProgressSnapshot: 'user_progress_snapshot',
  queuedAttempts: 'queued_attempts',
  queuedVerbAttempts: 'queued_verb_attempts',
  freeWritePrompts: 'free_write_prompts',
  offlineSessions: 'offline_sessions',
  verbCache: 'verb_cache',
  verbSentencesCache: 'verb_sentences_cache',
  verbConjugationsCache: 'verb_conjugations_cache',
  verbFavoritesCache: 'verb_favorites_cache',
  verbProgressCache: 'verb_progress_cache',
  verbCacheMeta: 'verb_cache_meta',
} as const

// ── Open / create DB ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OfflineDB = IDBPDatabase<any>

let dbPromise: Promise<OfflineDB> | null = null

export function getDB(): Promise<OfflineDB> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'))
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Module metadata
        if (!db.objectStoreNames.contains(STORES.downloadedModules)) {
          db.createObjectStore(STORES.downloadedModules, { keyPath: 'module_id' })
        }

        // Exercises
        if (!db.objectStoreNames.contains(STORES.exercises)) {
          const store = db.createObjectStore(STORES.exercises, { keyPath: 'id' })
          store.createIndex('concept_id', 'concept_id', { unique: false })
          store.createIndex('module_id', 'module_id', { unique: false })
        }

        // Concepts
        if (!db.objectStoreNames.contains(STORES.concepts)) {
          const store = db.createObjectStore(STORES.concepts, { keyPath: 'id' })
          store.createIndex('module_id', 'module_id', { unique: false })
        }

        // Units
        if (!db.objectStoreNames.contains(STORES.units)) {
          const store = db.createObjectStore(STORES.units, { keyPath: 'id' })
          store.createIndex('module_id', 'module_id', { unique: false })
        }

        // User progress snapshot
        if (!db.objectStoreNames.contains(STORES.userProgressSnapshot)) {
          db.createObjectStore(STORES.userProgressSnapshot, { keyPath: 'concept_id' })
        }

        // Queued grammar attempts
        if (!db.objectStoreNames.contains(STORES.queuedAttempts)) {
          const store = db.createObjectStore(STORES.queuedAttempts, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('session_id', 'session_id', { unique: false })
          store.createIndex('synced', 'synced', { unique: false })
        }

        // Queued verb attempts
        if (!db.objectStoreNames.contains(STORES.queuedVerbAttempts)) {
          const store = db.createObjectStore(STORES.queuedVerbAttempts, {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('synced', 'synced', { unique: false })
        }

        // Free-write prompts
        if (!db.objectStoreNames.contains(STORES.freeWritePrompts)) {
          db.createObjectStore(STORES.freeWritePrompts, { keyPath: 'concept_id' })
        }

        // Offline sessions
        if (!db.objectStoreNames.contains(STORES.offlineSessions)) {
          const store = db.createObjectStore(STORES.offlineSessions, { keyPath: 'id' })
          store.createIndex('synced', 'synced', { unique: false })
        }

        // Verb cache
        if (!db.objectStoreNames.contains(STORES.verbCache)) {
          db.createObjectStore(STORES.verbCache, { keyPath: 'id' })
        }

        // Verb sentences cache
        if (!db.objectStoreNames.contains(STORES.verbSentencesCache)) {
          const store = db.createObjectStore(STORES.verbSentencesCache, { keyPath: 'id' })
          store.createIndex('verb_id', 'verb_id', { unique: false })
          store.createIndex('tense', 'tense', { unique: false })
        }

        // Verb conjugations cache (compound key)
        if (!db.objectStoreNames.contains(STORES.verbConjugationsCache)) {
          db.createObjectStore(STORES.verbConjugationsCache, {
            keyPath: ['verb_id', 'tense'],
          })
        }

        // Verb favorites cache
        if (!db.objectStoreNames.contains(STORES.verbFavoritesCache)) {
          db.createObjectStore(STORES.verbFavoritesCache, { keyPath: 'verb_id' })
        }

        // Verb progress cache (compound key)
        if (!db.objectStoreNames.contains(STORES.verbProgressCache)) {
          db.createObjectStore(STORES.verbProgressCache, {
            keyPath: ['verb_id', 'tense'],
          })
        }

        // Verb cache metadata
        if (!db.objectStoreNames.contains(STORES.verbCacheMeta)) {
          db.createObjectStore(STORES.verbCacheMeta, { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

/** Close and reset the singleton (for testing). */
export async function resetDB(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      // ignore — DB may not have opened successfully
    }
  }
  dbPromise = null
}

// ── Downloaded modules ────────────────────────────────────────────────

export async function putDownloadedModule(mod: DownloadedModule): Promise<void> {
  const db = await getDB()
  await db.put(STORES.downloadedModules, mod)
}

export async function getDownloadedModule(moduleId: string): Promise<DownloadedModule | undefined> {
  const db = await getDB()
  return db.get(STORES.downloadedModules, moduleId)
}

export async function getAllDownloadedModules(): Promise<DownloadedModule[]> {
  const db = await getDB()
  return db.getAll(STORES.downloadedModules)
}

export async function isModuleDownloaded(moduleId: string): Promise<boolean> {
  const mod = await getDownloadedModule(moduleId)
  return mod !== undefined
}

export async function deleteModuleData(moduleId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    [STORES.downloadedModules, STORES.exercises, STORES.concepts, STORES.units, STORES.userProgressSnapshot, STORES.freeWritePrompts],
    'readwrite',
  )

  // Delete module metadata
  await tx.objectStore(STORES.downloadedModules).delete(moduleId)

  // Delete exercises by module_id index
  const exerciseIndex = tx.objectStore(STORES.exercises).index('module_id')
  let exerciseCursor = await exerciseIndex.openCursor(moduleId)
  while (exerciseCursor) {
    await exerciseCursor.delete()
    exerciseCursor = await exerciseCursor.continue()
  }

  // Delete concepts by module_id index
  const conceptIndex = tx.objectStore(STORES.concepts).index('module_id')
  let conceptCursor = await conceptIndex.openCursor(moduleId)
  while (conceptCursor) {
    // Also delete progress snapshot + free-write prompt for this concept
    const conceptId = conceptCursor.value.id as string
    await tx.objectStore(STORES.userProgressSnapshot).delete(conceptId)
    await tx.objectStore(STORES.freeWritePrompts).delete(conceptId)
    await conceptCursor.delete()
    conceptCursor = await conceptCursor.continue()
  }

  // Delete units by module_id index
  const unitIndex = tx.objectStore(STORES.units).index('module_id')
  let unitCursor = await unitIndex.openCursor(moduleId)
  while (unitCursor) {
    await unitCursor.delete()
    unitCursor = await unitCursor.continue()
  }

  await tx.done
}

// ── Exercises ─────────────────────────────────────────────────────────

export async function putExercises(exercises: OfflineExercise[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.exercises, 'readwrite')
  for (const e of exercises) {
    await tx.store.put(e)
  }
  await tx.done
}

export async function getExercisesByConcept(conceptId: string): Promise<OfflineExercise[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.exercises, 'concept_id', conceptId)
}

export async function getExercisesByModule(moduleId: string): Promise<OfflineExercise[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.exercises, 'module_id', moduleId)
}

export async function getAllExercises(): Promise<OfflineExercise[]> {
  const db = await getDB()
  return db.getAll(STORES.exercises)
}

// ── Concepts ──────────────────────────────────────────────────────────

export async function putConcepts(concepts: OfflineConcept[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.concepts, 'readwrite')
  for (const c of concepts) {
    await tx.store.put(c)
  }
  await tx.done
}

export async function getConcept(id: string): Promise<OfflineConcept | undefined> {
  const db = await getDB()
  return db.get(STORES.concepts, id)
}

export async function getConceptsByModule(moduleId: string): Promise<OfflineConcept[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.concepts, 'module_id', moduleId)
}

export async function getAllConcepts(): Promise<OfflineConcept[]> {
  const db = await getDB()
  return db.getAll(STORES.concepts)
}

// ── Units ─────────────────────────────────────────────────────────────

export async function putUnits(units: OfflineUnit[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.units, 'readwrite')
  for (const u of units) {
    await tx.store.put(u)
  }
  await tx.done
}

export async function getUnitsByModule(moduleId: string): Promise<OfflineUnit[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.units, 'module_id', moduleId)
}

// ── User progress snapshot ────────────────────────────────────────────

export async function putUserProgress(progress: OfflineUserProgress[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.userProgressSnapshot, 'readwrite')
  for (const p of progress) {
    await tx.store.put(p)
  }
  await tx.done
}

export async function getUserProgress(conceptId: string): Promise<OfflineUserProgress | undefined> {
  const db = await getDB()
  return db.get(STORES.userProgressSnapshot, conceptId)
}

export async function getAllUserProgress(): Promise<OfflineUserProgress[]> {
  const db = await getDB()
  return db.getAll(STORES.userProgressSnapshot)
}

// ── Free-write prompts ────────────────────────────────────────────────

export async function putFreeWritePrompts(prompts: OfflineFreeWritePrompt[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.freeWritePrompts, 'readwrite')
  for (const p of prompts) {
    await tx.store.put(p)
  }
  await tx.done
}

export async function getFreeWritePrompt(conceptId: string): Promise<OfflineFreeWritePrompt | undefined> {
  const db = await getDB()
  return db.get(STORES.freeWritePrompts, conceptId)
}

// ── Queued grammar attempts ───────────────────────────────────────────

export async function queueAttempt(attempt: Omit<QueuedAttempt, 'id'>): Promise<number> {
  const db = await getDB()
  const id = await db.add(STORES.queuedAttempts, attempt) as number
  requestBackgroundSync()
  return id
}

export async function getUnsyncedAttempts(): Promise<QueuedAttempt[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.queuedAttempts, 'synced', 0)
}

export async function markAttemptsSynced(ids: number[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.queuedAttempts, 'readwrite')
  for (const id of ids) {
    const attempt = await tx.store.get(id) as QueuedAttempt | undefined
    if (attempt) {
      attempt.synced = 1
      await tx.store.put(attempt)
    }
  }
  await tx.done
}

export async function getAttemptsBySession(sessionId: string): Promise<QueuedAttempt[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.queuedAttempts, 'session_id', sessionId)
}

// ── Queued verb attempts ──────────────────────────────────────────────

export async function queueVerbAttempt(attempt: Omit<QueuedVerbAttempt, 'id'>): Promise<number> {
  const db = await getDB()
  const id = await db.add(STORES.queuedVerbAttempts, attempt) as number
  requestBackgroundSync()
  return id
}

export async function getUnsyncedVerbAttempts(): Promise<QueuedVerbAttempt[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.queuedVerbAttempts, 'synced', 0)
}

export async function markVerbAttemptsSynced(ids: number[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.queuedVerbAttempts, 'readwrite')
  for (const id of ids) {
    const attempt = await tx.store.get(id) as QueuedVerbAttempt | undefined
    if (attempt) {
      attempt.synced = 1
      await tx.store.put(attempt)
    }
  }
  await tx.done
}

// ── Offline sessions ──────────────────────────────────────────────────

export async function putOfflineSession(session: OfflineSession): Promise<void> {
  const db = await getDB()
  await db.put(STORES.offlineSessions, session)
}

export async function getUnsyncedSessions(): Promise<OfflineSession[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.offlineSessions, 'synced', 0)
}

export async function markSessionSynced(sessionId: string): Promise<void> {
  const db = await getDB()
  const session = await db.get(STORES.offlineSessions, sessionId) as OfflineSession | undefined
  if (session) {
    session.synced = 1
    await db.put(STORES.offlineSessions, session)
  }
}

// ── Verb cache ────────────────────────────────────────────────────────

export async function putVerbCache(verbs: CachedVerb[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.verbCache, 'readwrite')
  for (const v of verbs) {
    await tx.store.put(v)
  }
  await tx.done
}

export async function getAllCachedVerbs(): Promise<CachedVerb[]> {
  const db = await getDB()
  return db.getAll(STORES.verbCache)
}

export async function putVerbSentences(sentences: CachedVerbSentence[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.verbSentencesCache, 'readwrite')
  for (const s of sentences) {
    await tx.store.put(s)
  }
  await tx.done
}

export async function getVerbSentences(verbId: string): Promise<CachedVerbSentence[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.verbSentencesCache, 'verb_id', verbId)
}

export async function getVerbSentencesByTense(tense: string): Promise<CachedVerbSentence[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.verbSentencesCache, 'tense', tense)
}

export async function getAllCachedVerbSentences(): Promise<CachedVerbSentence[]> {
  const db = await getDB()
  return db.getAll(STORES.verbSentencesCache)
}

export async function putVerbConjugations(conjugations: CachedVerbConjugation[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.verbConjugationsCache, 'readwrite')
  for (const c of conjugations) {
    await tx.store.put(c)
  }
  await tx.done
}

export async function getVerbConjugation(
  verbId: string,
  tense: string,
): Promise<CachedVerbConjugation | undefined> {
  const db = await getDB()
  return db.get(STORES.verbConjugationsCache, [verbId, tense])
}

export async function getAllCachedVerbConjugations(): Promise<CachedVerbConjugation[]> {
  const db = await getDB()
  return db.getAll(STORES.verbConjugationsCache)
}

export async function putVerbFavorites(favorites: CachedVerbFavorite[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.verbFavoritesCache, 'readwrite')
  // Clear existing favorites before writing new set
  await tx.store.clear()
  for (const f of favorites) {
    await tx.store.put(f)
  }
  await tx.done
}

export async function getAllCachedVerbFavorites(): Promise<CachedVerbFavorite[]> {
  const db = await getDB()
  return db.getAll(STORES.verbFavoritesCache)
}

export async function putVerbProgress(progress: CachedVerbProgress[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.verbProgressCache, 'readwrite')
  for (const p of progress) {
    await tx.store.put(p)
  }
  await tx.done
}

export async function getVerbProgress(
  verbId: string,
  tense: string,
): Promise<CachedVerbProgress | undefined> {
  const db = await getDB()
  return db.get(STORES.verbProgressCache, [verbId, tense])
}

export async function getAllCachedVerbProgress(): Promise<CachedVerbProgress[]> {
  const db = await getDB()
  return db.getAll(STORES.verbProgressCache)
}

// ── Verb cache metadata ───────────────────────────────────────────────

export async function setVerbCacheMeta(key: string, value: string): Promise<void> {
  const db = await getDB()
  await db.put(STORES.verbCacheMeta, { key, value } satisfies VerbCacheMeta)
}

export async function getVerbCacheMeta(key: string): Promise<string | undefined> {
  const db = await getDB()
  const row = await db.get(STORES.verbCacheMeta, key) as VerbCacheMeta | undefined
  return row?.value
}

export async function isVerbCacheFresh(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
  const version = await getVerbCacheMeta('version')
  if (!version) return false
  return Date.now() - Number(version) < maxAgeMs
}

// ── Background sync request ───────────────────────────────────────

/** Request a one-shot background sync (Chrome/Edge). No-ops silently on Safari. */
export function requestBackgroundSync(): void {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready
      .then((reg) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(reg as any).sync?.register('sync-offline-attempts').catch(() => {})
      })
      .catch(() => {})
  } catch {
    // guard against any unexpected error
  }
}

// ── Storage stats ─────────────────────────────────────────────────────

export interface StorageStats {
  downloadedModuleCount: number
  exerciseCount: number
  conceptCount: number
  queuedAttemptCount: number
  queuedVerbAttemptCount: number
  verbCacheCount: number
  verbSentenceCacheCount: number
}

export async function getStorageStats(): Promise<StorageStats> {
  const db = await getDB()
  return {
    downloadedModuleCount: await db.count(STORES.downloadedModules),
    exerciseCount: await db.count(STORES.exercises),
    conceptCount: await db.count(STORES.concepts),
    queuedAttemptCount: await db.count(STORES.queuedAttempts),
    queuedVerbAttemptCount: await db.count(STORES.queuedVerbAttempts),
    verbCacheCount: await db.count(STORES.verbCache),
    verbSentenceCacheCount: await db.count(STORES.verbSentencesCache),
  }
}

// ── Clear all data ────────────────────────────────────────────────────

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB()
  const storeNames = Object.values(STORES)
  const tx = db.transaction(storeNames, 'readwrite')
  for (const name of storeNames) {
    await tx.objectStore(name).clear()
  }
  await tx.done
}
