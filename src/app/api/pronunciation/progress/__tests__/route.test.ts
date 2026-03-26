import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn().mockReturnValue(true),
}))
vi.mock('@/lib/claude/client', () => ({
  __esModule: true,
  default: {},
  TUTOR_MODEL: 'mock-model',
  GRADE_MODEL: 'mock-model',
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

function makeRequest(body: unknown, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/pronunciation/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

describe('POST /api/pronunciation/progress', () => {
  const mockRpc = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never)
    mockRpc.mockResolvedValue({ error: null })
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(makeRequest({ category: 'stress', correct: true }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid category', async () => {
    const res = await POST(makeRequest({ category: 'invalid_cat', correct: true }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing correct field', async () => {
    const res = await POST(makeRequest({ category: 'stress' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-boolean correct', async () => {
    const res = await POST(makeRequest({ category: 'fluency', correct: 'yes' }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false } as never)

    const res = await POST(makeRequest({ category: 'rr', correct: true }))
    expect(res.status).toBe(429)
  })

  it('calls increment_pronunciation_progress RPC and returns ok', async () => {
    const res = await POST(makeRequest({ category: 'prosody', correct: false }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockRpc).toHaveBeenCalledWith('increment_pronunciation_progress', {
      p_user_id:  'user-1',
      p_category: 'prosody',
      p_correct:  false,
    })
  })

  it('accepts all valid categories', async () => {
    for (const cat of ['stress', 'fluency', 'prosody', 'rr', 'x', 'ɲ', 'vowels', 'consonants']) {
      mockRpc.mockResolvedValue({ error: null })
      const res = await POST(makeRequest({ category: cat, correct: true }))
      expect(res.status).toBe(200)
    }
  })

  it('returns 500 when RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('DB down'))

    const res = await POST(makeRequest({ category: 'vowels', correct: true }))
    expect(res.status).toBe(500)
  })
})
