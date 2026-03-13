import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/claude/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Write a short essay...' }],
      }),
    },
  },
  TUTOR_MODEL: 'claude-test',
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true })),
}))
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

import { validateOrigin } from '@/lib/api-utils'

const CONCEPT_ID = '11111111-1111-1111-1111-111111111111'

function makeRequest(body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept_ids: [CONCEPT_ID], ...body }),
  })
}

function setupMocks() {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [{ id: CONCEPT_ID, title: 'Test', explanation: 'Explanation' }],
          error: null,
        }),
      }),
    }),
  } as never)
}

describe('POST /api/topic', () => {
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
