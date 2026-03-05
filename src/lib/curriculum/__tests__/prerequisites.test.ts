import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computeUnlockedLevels, computeUnlockProgress } from '../prerequisites'

// Build a minimal mock Supabase client
function makeMockSupabase(
  concepts: { id: string; level: string | null }[],
  progress: { concept_id: string }[]
) {
  const fromFn = vi.fn((table: string) => {
    if (table === 'concepts') {
      return {
        select: vi.fn().mockReturnValue({
          data: concepts,
          error: null,
        }),
      }
    }
    if (table === 'user_progress') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: progress,
            error: null,
          }),
        }),
      }
    }
    return { select: vi.fn().mockReturnValue({ data: [], error: null }) }
  })
  return { from: fromFn } as unknown as Parameters<typeof computeUnlockedLevels>[0]
}

// Helper: create N concepts at a given level with IDs "level-1", "level-2", ...
function makeConcepts(level: string, count: number, offset = 0): { id: string; level: string }[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${level}-${i + 1 + offset}`, level }))
}

describe('computeUnlockedLevels', () => {
  it('B1 is always in the unlocked set, even with no user_progress', async () => {
    const supabase = makeMockSupabase(makeConcepts('B1', 5), [])
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B1')).toBe(true)
    expect(result.has('B2')).toBe(false)
    expect(result.has('C1')).toBe(false)
  })

  it('B2 is locked when 0% of B1 concepts have been attempted', async () => {
    const b1 = makeConcepts('B1', 10)
    const b2 = makeConcepts('B2', 5)
    const supabase = makeMockSupabase([...b1, ...b2], [])
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(false)
  })

  it('B2 is locked when < 80% of B1 concepts have been attempted (17/22)', async () => {
    const b1 = makeConcepts('B1', 22)
    const b2 = makeConcepts('B2', 10)
    // 17 out of 22 = 77.3% < 80%
    const progress = b1.slice(0, 17).map((c) => ({ concept_id: c.id }))
    const supabase = makeMockSupabase([...b1, ...b2], progress)
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(false)
  })

  it('B2 unlocks at exactly 80% of B1 attempted (18/22 ≈ 81.8%)', async () => {
    const b1 = makeConcepts('B1', 22)
    const b2 = makeConcepts('B2', 10)
    // 18/22 ≈ 81.8% >= 80%
    const progress = b1.slice(0, 18).map((c) => ({ concept_id: c.id }))
    const supabase = makeMockSupabase([...b1, ...b2], progress)
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(true)
  })

  it('C1 is locked when B2 is not yet unlocked', async () => {
    const b1 = makeConcepts('B1', 22)
    const b2 = makeConcepts('B2', 10)
    const c1 = makeConcepts('C1', 5)
    // Not enough B1 progress (17/22)
    const progress = b1.slice(0, 17).map((c) => ({ concept_id: c.id }))
    const supabase = makeMockSupabase([...b1, ...b2, ...c1], progress)
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('C1')).toBe(false)
  })

  it('C1 is locked when B2 unlocked but < 80% of B2 attempted', async () => {
    const b1 = makeConcepts('B1', 10)
    const b2 = makeConcepts('B2', 10)
    const c1 = makeConcepts('C1', 5)
    // All B1 attempted (unlocks B2), but only 7/10 B2 attempted = 70% < 80%
    const b1Progress = b1.map((c) => ({ concept_id: c.id }))
    const b2Progress = b2.slice(0, 7).map((c) => ({ concept_id: c.id }))
    const supabase = makeMockSupabase([...b1, ...b2, ...c1], [...b1Progress, ...b2Progress])
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(true)
    expect(result.has('C1')).toBe(false)
  })

  it('C1 unlocks at exactly 80% of B2 attempted (8/10)', async () => {
    const b1 = makeConcepts('B1', 10)
    const b2 = makeConcepts('B2', 10)
    const c1 = makeConcepts('C1', 5)
    const b1Progress = b1.map((c) => ({ concept_id: c.id }))
    const b2Progress = b2.slice(0, 8).map((c) => ({ concept_id: c.id }))
    const supabase = makeMockSupabase([...b1, ...b2, ...c1], [...b1Progress, ...b2Progress])
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(true)
    expect(result.has('C1')).toBe(true)
  })

  it('B2 unlocks immediately when there are no B1 concepts in DB', async () => {
    const b2 = makeConcepts('B2', 5)
    const supabase = makeMockSupabase(b2, [])
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(true)
  })

  it('C1 unlocks immediately when there are no B2 concepts in DB', async () => {
    const b1 = makeConcepts('B1', 10)
    const b1Progress = b1.map((c) => ({ concept_id: c.id }))
    // B2 empty → fraction defaults to 1 → C1 unlocks
    const supabase = makeMockSupabase(b1, b1Progress)
    const result = await computeUnlockedLevels(supabase, 'user-1')
    expect(result.has('B2')).toBe(true)
    expect(result.has('C1')).toBe(true)
  })
})

describe('computeUnlockProgress', () => {
  it('returns nextLevel=B2 when B1 not yet complete', () => {
    const b1 = makeConcepts('B1', 22)
    const b2 = makeConcepts('B2', 10)
    const attempted = new Set(b1.slice(0, 10).map((c) => c.id))
    const result = computeUnlockProgress([...b1, ...b2], attempted)
    expect(result.nextLevel).toBe('B2')
    expect(result.attempted).toBe(10)
    expect(result.total).toBe(22)
    expect(result.threshold).toBe(Math.ceil(22 * 0.8)) // 18
  })

  it('returns nextLevel=C1 when B1 complete but B2 not yet complete', () => {
    const b1 = makeConcepts('B1', 10)
    const b2 = makeConcepts('B2', 10)
    const attempted = new Set([
      ...b1.map((c) => c.id),
      ...b2.slice(0, 5).map((c) => c.id),
    ])
    const result = computeUnlockProgress([...b1, ...b2], attempted)
    expect(result.nextLevel).toBe('C1')
    expect(result.attempted).toBe(5)
    expect(result.total).toBe(10)
    expect(result.threshold).toBe(Math.ceil(10 * 0.8)) // 8
  })

  it('returns nextLevel=null when both B1 and B2 thresholds are met', () => {
    const b1 = makeConcepts('B1', 10)
    const b2 = makeConcepts('B2', 10)
    const attempted = new Set([...b1.map((c) => c.id), ...b2.map((c) => c.id)])
    const result = computeUnlockProgress([...b1, ...b2], attempted)
    expect(result.nextLevel).toBeNull()
    expect(result.attempted).toBe(0)
    expect(result.total).toBe(0)
  })

  it('threshold is correctly calculated as Math.ceil(total * 0.8)', () => {
    const b1 = makeConcepts('B1', 5) // ceil(5 * 0.8) = ceil(4) = 4
    const attempted = new Set(b1.slice(0, 2).map((c) => c.id))
    const result = computeUnlockProgress(b1, attempted)
    expect(result.threshold).toBe(4)
  })
})
