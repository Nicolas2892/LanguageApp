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

const UUID = '00000000-0000-0000-0000-000000000001'

function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/srs/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/srs/seed', () => {
  const mockRpc = vi.fn().mockResolvedValue({ error: null })

  beforeEach(() => {
    vi.clearAllMocks()
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
    const res = await POST(makeRequest({ items: [{ item_type: 'verb', verb_id: UUID, tense: 'present_indicative' }] }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty items array', async () => {
    const res = await POST(makeRequest({ items: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid item_type', async () => {
    const res = await POST(makeRequest({ items: [{ item_type: 'bad' }] }))
    expect(res.status).toBe(400)
  })

  it('calls seed_srs_items RPC with verb items', async () => {
    const items = [
      { item_type: 'verb', verb_id: UUID, tense: 'preterite' },
      { item_type: 'vocab', vocab_id: UUID },
    ]
    const res = await POST(makeRequest({ items }))
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('seed_srs_items', {
      p_user_id: 'user-1',
      p_items: JSON.stringify(items),
    })
    expect(await res.json()).toEqual({ ok: true, seeded: 2 })
  })

  it('returns 500 on RPC failure', async () => {
    mockRpc.mockRejectedValue(new Error('DB down'))
    const res = await POST(makeRequest({ items: [{ item_type: 'vocab', vocab_id: UUID }] }))
    expect(res.status).toBe(500)
  })
})
