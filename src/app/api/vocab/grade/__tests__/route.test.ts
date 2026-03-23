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

const VALID_VOCAB_ID = '00000000-0000-0000-0000-000000000001'

function makeRequest(body: unknown, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/vocab/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

describe('POST /api/vocab/grade', () => {
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

    const res = await POST(makeRequest({ vocab_id: VALID_VOCAB_ID, is_correct: true }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for non-uuid vocab_id', async () => {
    const res = await POST(makeRequest({ vocab_id: 'not-a-uuid', is_correct: true }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing is_correct', async () => {
    const res = await POST(makeRequest({ vocab_id: VALID_VOCAB_ID }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-boolean is_correct', async () => {
    const res = await POST(makeRequest({ vocab_id: VALID_VOCAB_ID, is_correct: 'yes' }))
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false } as never)

    const res = await POST(makeRequest({ vocab_id: VALID_VOCAB_ID, is_correct: true }))
    expect(res.status).toBe(429)
  })

  it('calls increment_vocab_progress RPC and returns ok', async () => {
    const res = await POST(makeRequest({ vocab_id: VALID_VOCAB_ID, is_correct: false }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockRpc).toHaveBeenCalledWith('increment_vocab_progress', {
      p_user_id:  'user-1',
      p_vocab_id: VALID_VOCAB_ID,
      p_correct:  false,
    })
  })

  it('returns 500 when RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('DB down'))

    const res = await POST(makeRequest({ vocab_id: VALID_VOCAB_ID, is_correct: true }))
    expect(res.status).toBe(500)
  })
})
