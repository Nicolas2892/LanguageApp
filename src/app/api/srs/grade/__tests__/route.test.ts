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
  updateStreakIfNeeded: vi.fn().mockResolvedValue(undefined),
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
import { updateStreakIfNeeded } from '@/lib/api-utils'

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/srs/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/srs/grade', () => {
  const mockRpc = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: no existing SRS row (new item)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      rpc: mockRpc,
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      rpc: mockRpc,
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'present_indicative', outcome: 'correct' }))
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false } as never)
    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'present_indicative', outcome: 'correct' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid body', async () => {
    const res = await POST(makeRequest({ item_type: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for verb without tense', async () => {
    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, outcome: 'correct' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for vocab without vocab_id', async () => {
    const res = await POST(makeRequest({ item_type: 'vocab', outcome: 'correct' }))
    expect(res.status).toBe(400)
  })

  it('calls upsert_verb_srs RPC for verb items', async () => {
    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'preterite', outcome: 'correct' }))
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('upsert_verb_srs', expect.objectContaining({
      p_user_id: 'user-1',
      p_verb_id: VALID_UUID,
      p_tense: 'preterite',
    }))
  })

  it('calls upsert_vocab_srs RPC for vocab items', async () => {
    const res = await POST(makeRequest({ item_type: 'vocab', vocab_id: VALID_UUID, outcome: 'incorrect' }))
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('upsert_vocab_srs', expect.objectContaining({
      p_user_id: 'user-1',
      p_vocab_id: VALID_UUID,
    }))
  })

  it('also calls increment_verb_progress for verb items', async () => {
    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'present_indicative', outcome: 'correct' }))
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('increment_verb_progress', {
      p_user_id: 'user-1',
      p_verb_id: VALID_UUID,
      p_tense: 'present_indicative',
      p_correct: true,
    })
  })

  it('also calls increment_vocab_progress for vocab items', async () => {
    const res = await POST(makeRequest({ item_type: 'vocab', vocab_id: VALID_UUID, outcome: 'incorrect' }))
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('increment_vocab_progress', {
      p_user_id: 'user-1',
      p_vocab_id: VALID_UUID,
      p_correct: false,
    })
  })

  it('calls updateStreakIfNeeded', async () => {
    await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'future', outcome: 'correct' }))
    expect(updateStreakIfNeeded).toHaveBeenCalled()
  })

  it('returns SRS result in response', async () => {
    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'present_indicative', outcome: 'correct' }))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.interval_days).toBeDefined()
    expect(body.due_date).toBeDefined()
  })

  it('returns 500 on RPC error', async () => {
    mockRpc.mockRejectedValue(new Error('DB down'))
    const res = await POST(makeRequest({ item_type: 'verb', verb_id: VALID_UUID, tense: 'present_indicative', outcome: 'correct' }))
    expect(res.status).toBe(500)
  })
})
