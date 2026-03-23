import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  resetDB,
  putCachedProfile,
  getCachedProfile,
  putCachedModules,
  getAllCachedModules,
  putDashboardCache,
  getDashboardCache,
  clearAllOfflineData,
} from '../db'
import type { CachedProfile, CachedModule, CachedDashboardStats } from '../types'

describe('IDB v2 stores (Fix-M)', () => {
  beforeEach(async () => {
    await resetDB()
    // fake-indexeddb needs a clean state
    const dbs = await indexedDB.databases()
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name)
    }
  })

  afterEach(async () => {
    await resetDB()
  })

  // ── Profile cache ──────────────────────────────────────────────────

  it('writes and reads a cached profile', async () => {
    const profile: CachedProfile = {
      key: 'current',
      display_name: 'Nico',
      streak: 5,
      streak_freeze_remaining: 1,
      computed_level: 'B2',
      timezone: 'Europe/Berlin',
      cached_at: '2026-03-23T10:00:00Z',
    }

    await putCachedProfile(profile)
    const result = await getCachedProfile()

    expect(result).toBeDefined()
    expect(result?.display_name).toBe('Nico')
    expect(result?.streak).toBe(5)
    expect(result?.computed_level).toBe('B2')
  })

  it('returns undefined when no profile is cached', async () => {
    const result = await getCachedProfile()
    expect(result).toBeUndefined()
  })

  it('overwrites profile on second put', async () => {
    await putCachedProfile({
      key: 'current',
      display_name: 'A',
      streak: 1,
      streak_freeze_remaining: 0,
      computed_level: 'B1',
      timezone: null,
      cached_at: '2026-03-23T10:00:00Z',
    })
    await putCachedProfile({
      key: 'current',
      display_name: 'B',
      streak: 10,
      streak_freeze_remaining: 1,
      computed_level: 'B2',
      timezone: 'America/New_York',
      cached_at: '2026-03-23T11:00:00Z',
    })

    const result = await getCachedProfile()
    expect(result?.display_name).toBe('B')
    expect(result?.streak).toBe(10)
  })

  // ── Modules cache ──────────────────────────────────────────────────

  it('writes and reads cached modules', async () => {
    const modules: CachedModule[] = [
      { id: 'm1', title: 'Connectors', order_index: 0 },
      { id: 'm2', title: 'Subjunctive', order_index: 1 },
    ]

    await putCachedModules(modules)
    const result = await getAllCachedModules()

    expect(result).toHaveLength(2)
    expect(result.map((m) => m.title)).toContain('Connectors')
    expect(result.map((m) => m.title)).toContain('Subjunctive')
  })

  it('clears old modules before writing new set', async () => {
    await putCachedModules([
      { id: 'm1', title: 'Old', order_index: 0 },
    ])
    await putCachedModules([
      { id: 'm2', title: 'New', order_index: 0 },
    ])

    const result = await getAllCachedModules()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('New')
  })

  // ── Dashboard cache ────────────────────────────────────────────────

  it('writes and reads dashboard cache', async () => {
    const stats: CachedDashboardStats = {
      key: 'current',
      due_count: 12,
      studied_count: 45,
      total_concepts: 100,
      cached_at: '2026-03-23T10:00:00Z',
    }

    await putDashboardCache(stats)
    const result = await getDashboardCache()

    expect(result).toBeDefined()
    expect(result?.due_count).toBe(12)
    expect(result?.studied_count).toBe(45)
    expect(result?.total_concepts).toBe(100)
  })

  it('returns undefined when no dashboard cache exists', async () => {
    const result = await getDashboardCache()
    expect(result).toBeUndefined()
  })

  // ── Clear all data includes v2 stores ──────────────────────────────

  it('clearAllOfflineData clears v2 stores', async () => {
    await putCachedProfile({
      key: 'current',
      display_name: 'Test',
      streak: 1,
      streak_freeze_remaining: 0,
      computed_level: 'B1',
      timezone: null,
      cached_at: '2026-03-23T10:00:00Z',
    })
    await putCachedModules([{ id: 'm1', title: 'M1', order_index: 0 }])
    await putDashboardCache({
      key: 'current',
      due_count: 1,
      studied_count: 1,
      total_concepts: 1,
      cached_at: '2026-03-23T10:00:00Z',
    })

    await clearAllOfflineData()

    expect(await getCachedProfile()).toBeUndefined()
    expect(await getAllCachedModules()).toHaveLength(0)
    expect(await getDashboardCache()).toBeUndefined()
  })
})
