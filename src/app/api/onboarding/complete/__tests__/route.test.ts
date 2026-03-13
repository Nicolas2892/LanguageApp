import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

import { validateOrigin } from '@/lib/api-utils'

const CONCEPT_ID = '11111111-1111-1111-1111-111111111111'
const EXERCISE_ID = '22222222-2222-2222-2222-222222222222'

function makeRequest() {
  return new Request('http://localhost/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      results: [{
        concept_id: CONCEPT_ID,
        exercise_id: EXERCISE_ID,
        user_answer: 'test answer',
        score: 2,
      }],
    }),
  })
}

function setupMocks() {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  } as never)
}

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when origin validation fails', async () => {
    setupMocks()
    vi.mocked(validateOrigin).mockReturnValue(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 200 when origin is valid', async () => {
    setupMocks()
    vi.mocked(validateOrigin).mockReturnValue(true)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
  })
})
