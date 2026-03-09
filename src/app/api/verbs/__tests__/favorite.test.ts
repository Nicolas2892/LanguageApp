import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../favorite/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn().mockReturnValue(true),
}))

import { createClient } from '@/lib/supabase/server'

const VALID_VERB_ID = '00000000-0000-0000-0000-000000000002'

function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/verbs/favorite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/verbs/favorite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockSupabase(existingRow: unknown) {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existingRow }),
        }),
      }),
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockReturnValue({ select: mockSelect, delete: mockDelete, insert: mockInsert }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  }

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(makeRequest({ verb_id: VALID_VERB_ID }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for non-uuid verb_id', async () => {
    mockSupabase(null)
    const res = await POST(makeRequest({ verb_id: 'not-uuid' }))
    expect(res.status).toBe(400)
  })

  it('returns favorited:true when no existing row (insert)', async () => {
    mockSupabase(null)
    const res = await POST(makeRequest({ verb_id: VALID_VERB_ID }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ favorited: true })
  })

  it('returns favorited:false when row exists (delete)', async () => {
    mockSupabase({ id: 'fav-1' })
    const res = await POST(makeRequest({ verb_id: VALID_VERB_ID }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ favorited: false })
  })
})
