import { describe, it, expect, vi } from 'vitest'
import { fetchUnifiedDueQueue, fetchUnifiedDueCount } from '../queue'

// Builds a chainable Supabase mock where every method returns the chain itself,
// except terminal methods which resolve with the given result.
function buildChainMock(result: { data?: unknown[]; count?: number; error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  const terminal = vi.fn().mockResolvedValue(result)

  chain.select = vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
    if (opts?.head) {
      return {
        eq: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ count: result.count ?? 0, error: null }),
        }),
      }
    }
    return chain
  })
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.lte = vi.fn().mockReturnValue({ limit: terminal })
  chain.limit = terminal

  return chain
}

function mockSupabase(
  grammar: unknown[],
  verbs: unknown[],
  vocab: unknown[],
  counts?: { grammar: number; srs: number },
) {
  let callIdx = 0
  const results = [
    { data: grammar, error: null, count: counts?.grammar ?? grammar.length },
    { data: verbs, error: null, count: counts?.srs ?? verbs.length + vocab.length },
    { data: vocab, error: null, count: 0 },
  ]
  return {
    from: vi.fn().mockImplementation(() => {
      return buildChainMock(results[callIdx++ % 3])
    }),
  }
}

describe('fetchUnifiedDueQueue', () => {
  it('returns empty array when no items are due', async () => {
    const supabase = mockSupabase([], [], [])
    const result = await fetchUnifiedDueQueue(supabase as never, 'user-1', '2026-03-26')
    expect(result).toEqual([])
  })

  it('returns grammar items', async () => {
    const supabase = mockSupabase([{ concept_id: 'c1' }], [], [])
    const result = await fetchUnifiedDueQueue(supabase as never, 'user-1', '2026-03-26')
    expect(result).toContainEqual({ type: 'concept', conceptId: 'c1' })
  })

  it('returns verb items', async () => {
    const supabase = mockSupabase([], [{ verb_id: 'v1', tense: 'present_indicative' }], [])
    const result = await fetchUnifiedDueQueue(supabase as never, 'user-1', '2026-03-26')
    expect(result).toContainEqual({ type: 'verb', verbId: 'v1', tense: 'present_indicative' })
  })

  it('returns vocab items', async () => {
    const supabase = mockSupabase([], [], [{ vocab_id: 'voc1' }])
    const result = await fetchUnifiedDueQueue(supabase as never, 'user-1', '2026-03-26')
    expect(result).toContainEqual({ type: 'vocab', vocabId: 'voc1' })
  })

  it('merges all three types', async () => {
    const supabase = mockSupabase(
      [{ concept_id: 'c1' }],
      [{ verb_id: 'v1', tense: 'preterite' }],
      [{ vocab_id: 'voc1' }],
    )
    const result = await fetchUnifiedDueQueue(supabase as never, 'user-1', '2026-03-26')
    expect(result).toHaveLength(3)
  })

  it('skips verb items with null verb_id', async () => {
    const supabase = mockSupabase([], [{ verb_id: null, tense: null }], [])
    const result = await fetchUnifiedDueQueue(supabase as never, 'user-1', '2026-03-26')
    expect(result).toHaveLength(0)
  })
})

describe('fetchUnifiedDueCount', () => {
  it('returns sum of grammar + srs counts', async () => {
    const supabase = mockSupabase([], [], [], { grammar: 3, srs: 7 })
    const count = await fetchUnifiedDueCount(supabase as never, 'user-1', '2026-03-26')
    expect(count).toBe(10)
  })

  it('returns 0 when nothing is due', async () => {
    const supabase = mockSupabase([], [], [], { grammar: 0, srs: 0 })
    const count = await fetchUnifiedDueCount(supabase as never, 'user-1', '2026-03-26')
    expect(count).toBe(0)
  })
})
