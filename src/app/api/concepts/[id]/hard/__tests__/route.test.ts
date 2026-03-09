import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/api-utils', () => ({ validateOrigin: vi.fn(() => true) }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))

// Supabase mock chain helpers
const mockSingle   = vi.fn()
const mockSelect   = vi.fn()
const mockUpdate   = vi.fn()
const mockInsert   = vi.fn()
const mockEqUser   = vi.fn()
const mockEqConcept = vi.fn()
const mockFrom     = vi.fn()
const mockGetUser  = vi.fn()

function setupSupabaseMock({
  userId = 'user-1',
  existingRow = null as { is_hard: boolean } | null,
} = {}) {
  mockGetUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } })

  // .update().eq().eq().select().single() chain
  mockSingle.mockResolvedValue({ data: existingRow, error: existingRow ? null : { code: 'PGRST116' } })
  mockSelect.mockReturnValue({ single: mockSingle })
  mockEqConcept.mockReturnValue({ select: mockSelect })
  mockEqUser.mockReturnValue({ eq: mockEqConcept })
  mockUpdate.mockReturnValue({ eq: mockEqUser })

  // .insert() chain
  mockInsert.mockResolvedValue({ error: null })

  mockFrom.mockReturnValue({
    update: mockUpdate,
    insert: mockInsert,
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  } as never)
}

function makeRequest(body: unknown, conceptId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479') {
  return {
    request: new Request(`http://localhost/api/concepts/${conceptId}/hard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params: Promise.resolve({ id: conceptId }),
  }
}

describe('POST /api/concepts/[id]/hard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    setupSupabaseMock({ userId: '' })
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { request, params } = makeRequest({ is_hard: true })
    const res = await POST(request, { params })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 for missing is_hard field', async () => {
    setupSupabaseMock()
    const { request, params } = makeRequest({})
    const res = await POST(request, { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid request')
  })

  it('returns 400 when is_hard is not a boolean', async () => {
    setupSupabaseMock()
    const { request, params } = makeRequest({ is_hard: 'yes' })
    const res = await POST(request, { params })
    expect(res.status).toBe(400)
  })

  it('update path: returns { is_hard: true } when row already exists', async () => {
    setupSupabaseMock({ existingRow: { is_hard: true } })
    const { request, params } = makeRequest({ is_hard: true })
    const res = await POST(request, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.is_hard).toBe(true)
    // update was called, insert was not
    expect(mockUpdate).toHaveBeenCalledWith({ is_hard: true })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('update path: returns { is_hard: false } when unflagging an existing row', async () => {
    setupSupabaseMock({ existingRow: { is_hard: false } })
    const { request, params } = makeRequest({ is_hard: false })
    const res = await POST(request, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.is_hard).toBe(false)
  })

  it('insert path: creates row with SRS defaults when no existing progress row', async () => {
    setupSupabaseMock({ existingRow: null })
    const { request, params } = makeRequest({ is_hard: true })
    const res = await POST(request, { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.is_hard).toBe(true)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        concept_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        is_hard: true,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
      }),
    )
  })
})
