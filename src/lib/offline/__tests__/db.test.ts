import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  resetDB,
  putDownloadedModule,
  getDownloadedModule,
  getAllDownloadedModules,
  isModuleDownloaded,
  deleteModuleData,
  putExercises,
  getExercisesByConcept,
  getExercisesByModule,
  getAllExercises,
  putConcepts,
  getConcept,
  getConceptsByModule,
  getAllConcepts,
  putUnits,
  getUnitsByModule,
  putUserProgress,
  getUserProgress,
  getAllUserProgress,
  putFreeWritePrompts,
  getFreeWritePrompt,
  queueAttempt,
  getUnsyncedAttempts,
  markAttemptsSynced,
  getAttemptsBySession,
  queueVerbAttempt,
  getUnsyncedVerbAttempts,
  markVerbAttemptsSynced,
  putOfflineSession,
  getUnsyncedSessions,
  markSessionSynced,
  putVerbCache,
  getAllCachedVerbs,
  putVerbSentences,
  getVerbSentences,
  getAllCachedVerbSentences,
  putVerbConjugations,
  getVerbConjugation,
  putVerbFavorites,
  getAllCachedVerbFavorites,
  putVerbProgress,
  getVerbProgress,
  setVerbCacheMeta,
  getVerbCacheMeta,
  isVerbCacheFresh,
  getStorageStats,
  clearAllOfflineData,
} from '../db'
import type {
  DownloadedModule,
  OfflineExercise,
  OfflineConcept,
  OfflineUnit,
  OfflineUserProgress,
  QueuedAttempt,
  OfflineSession,
  CachedVerb,
  CachedVerbSentence,
  CachedVerbConjugation,
  CachedVerbProgress,
} from '../types'

// Reset IDB between tests to avoid cross-test pollution
beforeEach(async () => {
  await resetDB()
  // Delete the database so the next getDB() triggers a fresh upgrade
  const req = indexedDB.deleteDatabase('senda-offline')
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
})

// ── Test data factories ───────────────────────────────────────────────

function makeModule(overrides: Partial<DownloadedModule> = {}): DownloadedModule {
  return {
    module_id: 'mod-1',
    title: 'Test Module',
    order_index: 0,
    downloaded_at: '2026-03-15T10:00:00Z',
    exercise_count: 10,
    concept_count: 3,
    version: Date.now(),
    ...overrides,
  }
}

function makeExercise(overrides: Partial<OfflineExercise> = {}): OfflineExercise {
  return {
    id: 'ex-1',
    concept_id: 'con-1',
    module_id: 'mod-1',
    type: 'gap_fill',
    prompt: 'Fill the gap: ___',
    expected_answer: 'hola',
    answer_variants: null,
    hint_1: 'Greeting',
    hint_2: null,
    annotations: null,
    source: 'seed',
    ...overrides,
  }
}

function makeConcept(overrides: Partial<OfflineConcept> = {}): OfflineConcept {
  return {
    id: 'con-1',
    module_id: 'mod-1',
    unit_id: 'unit-1',
    type: 'grammar',
    title: 'Ser vs Estar',
    explanation: 'Explains usage',
    examples: [],
    difficulty: 1,
    level: 'B1',
    grammar_focus: null,
    ...overrides,
  }
}

function makeUnit(overrides: Partial<OfflineUnit> = {}): OfflineUnit {
  return {
    id: 'unit-1',
    module_id: 'mod-1',
    title: 'Test Unit',
    order_index: 0,
    ...overrides,
  }
}

function makeProgress(overrides: Partial<OfflineUserProgress> = {}): OfflineUserProgress {
  return {
    concept_id: 'con-1',
    ease_factor: 2.5,
    interval_days: 1,
    due_date: '2026-03-15',
    repetitions: 0,
    production_mastered: false,
    is_hard: false,
    ...overrides,
  }
}

// ── Downloaded Modules ────────────────────────────────────────────────

describe('Downloaded Modules', () => {
  it('puts and gets a module', async () => {
    const mod = makeModule()
    await putDownloadedModule(mod)
    const result = await getDownloadedModule('mod-1')
    expect(result).toEqual(mod)
  })

  it('returns undefined for unknown module', async () => {
    const result = await getDownloadedModule('nonexistent')
    expect(result).toBeUndefined()
  })

  it('lists all downloaded modules', async () => {
    await putDownloadedModule(makeModule({ module_id: 'mod-1' }))
    await putDownloadedModule(makeModule({ module_id: 'mod-2', title: 'Module 2' }))
    const all = await getAllDownloadedModules()
    expect(all).toHaveLength(2)
  })

  it('checks if a module is downloaded', async () => {
    expect(await isModuleDownloaded('mod-1')).toBe(false)
    await putDownloadedModule(makeModule())
    expect(await isModuleDownloaded('mod-1')).toBe(true)
  })

  it('overwrites on duplicate put', async () => {
    await putDownloadedModule(makeModule({ exercise_count: 5 }))
    await putDownloadedModule(makeModule({ exercise_count: 10 }))
    const result = await getDownloadedModule('mod-1')
    expect(result?.exercise_count).toBe(10)
  })
})

// ── Exercises ─────────────────────────────────────────────────────────

describe('Exercises', () => {
  it('puts and gets exercises by concept', async () => {
    await putExercises([
      makeExercise({ id: 'ex-1', concept_id: 'con-1' }),
      makeExercise({ id: 'ex-2', concept_id: 'con-1' }),
      makeExercise({ id: 'ex-3', concept_id: 'con-2' }),
    ])
    const result = await getExercisesByConcept('con-1')
    expect(result).toHaveLength(2)
  })

  it('gets exercises by module', async () => {
    await putExercises([
      makeExercise({ id: 'ex-1', module_id: 'mod-1' }),
      makeExercise({ id: 'ex-2', module_id: 'mod-2' }),
    ])
    const result = await getExercisesByModule('mod-1')
    expect(result).toHaveLength(1)
  })

  it('gets all exercises', async () => {
    await putExercises([
      makeExercise({ id: 'ex-1' }),
      makeExercise({ id: 'ex-2' }),
    ])
    expect(await getAllExercises()).toHaveLength(2)
  })
})

// ── Concepts ──────────────────────────────────────────────────────────

describe('Concepts', () => {
  it('puts and gets a concept by ID', async () => {
    const concept = makeConcept()
    await putConcepts([concept])
    const result = await getConcept('con-1')
    expect(result).toEqual(concept)
  })

  it('gets concepts by module', async () => {
    await putConcepts([
      makeConcept({ id: 'con-1', module_id: 'mod-1' }),
      makeConcept({ id: 'con-2', module_id: 'mod-2' }),
    ])
    const result = await getConceptsByModule('mod-1')
    expect(result).toHaveLength(1)
  })

  it('gets all concepts', async () => {
    await putConcepts([makeConcept({ id: 'c1' }), makeConcept({ id: 'c2' })])
    expect(await getAllConcepts()).toHaveLength(2)
  })
})

// ── Units ─────────────────────────────────────────────────────────────

describe('Units', () => {
  it('puts and gets units by module', async () => {
    await putUnits([
      makeUnit({ id: 'u1', module_id: 'mod-1' }),
      makeUnit({ id: 'u2', module_id: 'mod-2' }),
    ])
    const result = await getUnitsByModule('mod-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('u1')
  })
})

// ── User Progress Snapshot ────────────────────────────────────────────

describe('User Progress Snapshot', () => {
  it('puts and gets progress by concept_id', async () => {
    const progress = makeProgress()
    await putUserProgress([progress])
    const result = await getUserProgress('con-1')
    expect(result).toEqual(progress)
  })

  it('gets all progress', async () => {
    await putUserProgress([
      makeProgress({ concept_id: 'c1' }),
      makeProgress({ concept_id: 'c2' }),
    ])
    expect(await getAllUserProgress()).toHaveLength(2)
  })
})

// ── Free-Write Prompts ────────────────────────────────────────────────

describe('Free-Write Prompts', () => {
  it('puts and gets a prompt by concept_id', async () => {
    await putFreeWritePrompts([{ concept_id: 'c1', prompt: 'Write about...' }])
    const result = await getFreeWritePrompt('c1')
    expect(result?.prompt).toBe('Write about...')
  })

  it('returns undefined for missing prompt', async () => {
    expect(await getFreeWritePrompt('missing')).toBeUndefined()
  })
})

// ── Queued Grammar Attempts ───────────────────────────────────────────

describe('Queued Attempts', () => {
  const baseAttempt: Omit<QueuedAttempt, 'id'> = {
    session_id: 'sess-1',
    exercise_id: 'ex-1',
    concept_id: 'con-1',
    concept_title: 'Ser vs Estar',
    exercise_type: 'gap_fill',
    exercise_prompt: 'Fill ___',
    user_answer: 'soy',
    expected_answer: 'soy',
    answer_variants: null,
    attempted_at: '2026-03-15T10:00:00Z',
    synced: 0,
  }

  it('queues an attempt and returns an auto-increment ID', async () => {
    const id = await queueAttempt(baseAttempt)
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })

  it('gets unsynced attempts', async () => {
    await queueAttempt({ ...baseAttempt, synced: 0 })
    await queueAttempt({ ...baseAttempt, synced: 1 })
    const unsynced = await getUnsyncedAttempts()
    expect(unsynced).toHaveLength(1)
  })

  it('marks attempts as synced', async () => {
    const id1 = await queueAttempt(baseAttempt)
    const id2 = await queueAttempt({ ...baseAttempt, user_answer: 'estoy' })
    await markAttemptsSynced([id1])
    const unsynced = await getUnsyncedAttempts()
    expect(unsynced).toHaveLength(1)
    expect(unsynced[0].id).toBe(id2)
  })

  it('gets attempts by session', async () => {
    await queueAttempt(baseAttempt)
    await queueAttempt({ ...baseAttempt, session_id: 'sess-2' })
    const result = await getAttemptsBySession('sess-1')
    expect(result).toHaveLength(1)
  })
})

// ── Queued Verb Attempts ──────────────────────────────────────────────

describe('Queued Verb Attempts', () => {
  it('queues and retrieves unsynced verb attempts', async () => {
    await queueVerbAttempt({
      verb_id: 'v1',
      tense: 'presente',
      correct: true,
      attempted_at: '2026-03-15T10:00:00Z',
      synced: 0,
    })
    const unsynced = await getUnsyncedVerbAttempts()
    expect(unsynced).toHaveLength(1)
  })

  it('marks verb attempts as synced', async () => {
    const id = await queueVerbAttempt({
      verb_id: 'v1',
      tense: 'presente',
      correct: true,
      attempted_at: '2026-03-15T10:00:00Z',
      synced: 0,
    })
    await markVerbAttemptsSynced([id])
    expect(await getUnsyncedVerbAttempts()).toHaveLength(0)
  })
})

// ── Offline Sessions ──────────────────────────────────────────────────

describe('Offline Sessions', () => {
  const baseSession: OfflineSession = {
    id: 'sess-1',
    started_at: '2026-03-15T10:00:00Z',
    ended_at: '2026-03-15T10:10:00Z',
    exercise_count: 5,
    module_id: 'mod-1',
    synced: 0,
  }

  it('puts and retrieves unsynced sessions', async () => {
    await putOfflineSession(baseSession)
    const unsynced = await getUnsyncedSessions()
    expect(unsynced).toHaveLength(1)
  })

  it('marks a session as synced', async () => {
    await putOfflineSession(baseSession)
    await markSessionSynced('sess-1')
    expect(await getUnsyncedSessions()).toHaveLength(0)
  })
})

// ── Verb Cache ────────────────────────────────────────────────────────

describe('Verb Cache', () => {
  const verb: CachedVerb = {
    id: 'v1',
    infinitive: 'ser',
    english: 'to be',
    frequency_rank: 1,
    verb_group: 'irregular',
  }

  it('puts and gets verbs', async () => {
    await putVerbCache([verb])
    const all = await getAllCachedVerbs()
    expect(all).toHaveLength(1)
    expect(all[0].infinitive).toBe('ser')
  })
})

describe('Verb Sentences Cache', () => {
  const sentence: CachedVerbSentence = {
    id: 'vs-1',
    verb_id: 'v1',
    tense: 'presente',
    pronoun: 'yo',
    sentence: 'Yo _____ estudiante.',
    correct_form: 'soy',
    tense_rule: 'irregular',
  }

  it('puts and gets sentences by verb_id', async () => {
    await putVerbSentences([sentence])
    const result = await getVerbSentences('v1')
    expect(result).toHaveLength(1)
  })

  it('gets all sentences', async () => {
    await putVerbSentences([
      sentence,
      { ...sentence, id: 'vs-2', verb_id: 'v2' },
    ])
    expect(await getAllCachedVerbSentences()).toHaveLength(2)
  })
})

describe('Verb Conjugations Cache', () => {
  const conj: CachedVerbConjugation = {
    verb_id: 'v1',
    tense: 'presente',
    stem: 's',
    yo: 'soy',
    tu: 'eres',
    el: 'es',
    nosotros: 'somos',
    vosotros: 'sois',
    ellos: 'son',
  }

  it('puts and gets conjugation by compound key', async () => {
    await putVerbConjugations([conj])
    const result = await getVerbConjugation('v1', 'presente')
    expect(result?.yo).toBe('soy')
  })

  it('returns undefined for missing conjugation', async () => {
    const result = await getVerbConjugation('v1', 'preterito')
    expect(result).toBeUndefined()
  })
})

describe('Verb Favorites Cache', () => {
  it('puts and gets favorites', async () => {
    await putVerbFavorites([{ verb_id: 'v1' }, { verb_id: 'v2' }])
    const all = await getAllCachedVerbFavorites()
    expect(all).toHaveLength(2)
  })

  it('clears previous favorites on put', async () => {
    await putVerbFavorites([{ verb_id: 'v1' }, { verb_id: 'v2' }])
    await putVerbFavorites([{ verb_id: 'v3' }])
    const all = await getAllCachedVerbFavorites()
    expect(all).toHaveLength(1)
    expect(all[0].verb_id).toBe('v3')
  })
})

describe('Verb Progress Cache', () => {
  const progress: CachedVerbProgress = {
    verb_id: 'v1',
    tense: 'presente',
    attempt_count: 10,
    correct_count: 8,
  }

  it('puts and gets verb progress by compound key', async () => {
    await putVerbProgress([progress])
    const result = await getVerbProgress('v1', 'presente')
    expect(result?.correct_count).toBe(8)
  })
})

// ── Verb Cache Meta ───────────────────────────────────────────────────

describe('Verb Cache Meta', () => {
  it('sets and gets a meta key', async () => {
    await setVerbCacheMeta('version', '1710500000000')
    const result = await getVerbCacheMeta('version')
    expect(result).toBe('1710500000000')
  })

  it('returns undefined for missing key', async () => {
    expect(await getVerbCacheMeta('nonexistent')).toBeUndefined()
  })

  it('detects fresh cache', async () => {
    await setVerbCacheMeta('version', String(Date.now()))
    expect(await isVerbCacheFresh()).toBe(true)
  })

  it('detects stale cache', async () => {
    await setVerbCacheMeta('version', String(Date.now() - 48 * 60 * 60 * 1000))
    expect(await isVerbCacheFresh()).toBe(false)
  })

  it('treats missing version as stale', async () => {
    expect(await isVerbCacheFresh()).toBe(false)
  })
})

// ── Delete Module Data ────────────────────────────────────────────────

describe('deleteModuleData', () => {
  it('removes all data for a module', async () => {
    // Set up data for mod-1
    await putDownloadedModule(makeModule({ module_id: 'mod-1' }))
    await putExercises([
      makeExercise({ id: 'ex-1', module_id: 'mod-1', concept_id: 'con-1' }),
      makeExercise({ id: 'ex-2', module_id: 'mod-1', concept_id: 'con-1' }),
    ])
    await putConcepts([makeConcept({ id: 'con-1', module_id: 'mod-1' })])
    await putUnits([makeUnit({ id: 'u1', module_id: 'mod-1' })])
    await putUserProgress([makeProgress({ concept_id: 'con-1' })])
    await putFreeWritePrompts([{ concept_id: 'con-1', prompt: 'Write about...' }])

    // Set up data for mod-2 (should not be deleted)
    await putDownloadedModule(makeModule({ module_id: 'mod-2', title: 'Module 2' }))
    await putExercises([makeExercise({ id: 'ex-3', module_id: 'mod-2', concept_id: 'con-2' })])
    await putConcepts([makeConcept({ id: 'con-2', module_id: 'mod-2' })])

    await deleteModuleData('mod-1')

    // mod-1 data gone
    expect(await isModuleDownloaded('mod-1')).toBe(false)
    expect(await getExercisesByModule('mod-1')).toHaveLength(0)
    expect(await getConceptsByModule('mod-1')).toHaveLength(0)
    expect(await getUnitsByModule('mod-1')).toHaveLength(0)
    expect(await getUserProgress('con-1')).toBeUndefined()
    expect(await getFreeWritePrompt('con-1')).toBeUndefined()

    // mod-2 data intact
    expect(await isModuleDownloaded('mod-2')).toBe(true)
    expect(await getExercisesByModule('mod-2')).toHaveLength(1)
  })
})

// ── Storage Stats ─────────────────────────────────────────────────────

describe('getStorageStats', () => {
  it('returns counts for all stores', async () => {
    await putDownloadedModule(makeModule())
    await putExercises([makeExercise()])
    await putConcepts([makeConcept()])
    await queueAttempt({
      session_id: 's1',
      exercise_id: 'ex-1',
      concept_id: 'con-1',
      concept_title: 'Test',
      exercise_type: 'gap_fill',
      exercise_prompt: 'Fill',
      user_answer: 'x',
      expected_answer: 'x',
      answer_variants: null,
      attempted_at: '2026-03-15T10:00:00Z',
      synced: 0,
    })
    await putVerbCache([{
      id: 'v1',
      infinitive: 'ser',
      english: 'to be',
      frequency_rank: 1,
      verb_group: 'irregular',
    }])

    const stats = await getStorageStats()
    expect(stats.downloadedModuleCount).toBe(1)
    expect(stats.exerciseCount).toBe(1)
    expect(stats.conceptCount).toBe(1)
    expect(stats.queuedAttemptCount).toBe(1)
    expect(stats.verbCacheCount).toBe(1)
  })
})

// ── Clear All ─────────────────────────────────────────────────────────

describe('clearAllOfflineData', () => {
  it('clears all stores', async () => {
    await putDownloadedModule(makeModule())
    await putExercises([makeExercise()])
    await putConcepts([makeConcept()])
    await putVerbCache([{
      id: 'v1',
      infinitive: 'ser',
      english: 'to be',
      frequency_rank: 1,
      verb_group: 'irregular',
    }])

    await clearAllOfflineData()

    const stats = await getStorageStats()
    expect(stats.downloadedModuleCount).toBe(0)
    expect(stats.exerciseCount).toBe(0)
    expect(stats.conceptCount).toBe(0)
    expect(stats.verbCacheCount).toBe(0)
  })
})
