import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

import { validateOrigin } from '@/lib/api-utils'

function makeRequest() {
  return new Request('http://localhost/api/sessions/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      started_at: '2026-03-13T10:00:00Z',
      concepts_reviewed: 5,
      accuracy: 80,
    }),
  })
}

function setupMocks() {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as never)
}

describe('POST /api/sessions/complete', () => {
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
