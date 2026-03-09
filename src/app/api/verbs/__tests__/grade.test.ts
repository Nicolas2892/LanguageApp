import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../grade/route'

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

const VALID_VERB_ID = '00000000-0000-0000-0000-000000000001'

function makeRequest(body: unknown, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/verbs/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

describe('POST /api/verbs/grade', () => {
  const mockRpc = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(makeRequest({ verb_id: VALID_VERB_ID, tense: 'present_indicative', is_correct: true }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid tense', async () => {
    const res = await POST(makeRequest({ verb_id: VALID_VERB_ID, tense: 'bad_tense', is_correct: true }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-uuid verb_id', async () => {
    const res = await POST(makeRequest({ verb_id: 'not-a-uuid', tense: 'present_indicative', is_correct: true }))
    expect(res.status).toBe(400)
  })

  it('calls increment_verb_progress RPC and returns ok', async () => {
    const res = await POST(makeRequest({ verb_id: VALID_VERB_ID, tense: 'preterite', is_correct: false }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockRpc).toHaveBeenCalledWith('increment_verb_progress', {
      p_user_id: 'user-1',
      p_verb_id:  VALID_VERB_ID,
      p_tense:    'preterite',
      p_correct:  false,
    })
  })
})
