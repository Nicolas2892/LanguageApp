import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/api-utils', () => ({ validateOrigin: vi.fn(() => true) }))

const mockSingle   = vi.fn()
const mockEq       = vi.fn()
const mockSelect   = vi.fn()
const mockUpdate   = vi.fn()
const mockUpdateEq = vi.fn()
const mockFrom     = vi.fn()
const mockGetUser  = vi.fn()

function setupSupabaseMock({
  userId     = 'user-1',
  isAdmin    = true,
  updateError = null,
}: {
  userId?:      string | null
  isAdmin?:     boolean
  updateError?: unknown
} = {}) {
  mockGetUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } })
  mockSingle.mockResolvedValue({ data: isAdmin ? { is_admin: true } : { is_admin: false } })
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockUpdateEq.mockResolvedValue({ error: updateError })
  mockUpdate.mockReturnValue({ eq: mockUpdateEq })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'exercises') return { update: mockUpdate }
    return { select: mockSelect }
  })
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  } as never)
}

const VALID_BODY = {
  prompt: 'Translate: "I want to go"',
  expected_answer: 'Quiero ir',
  hint_1: null,
  hint_2: null,
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/exercises/abc-123', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  })
}

const mockParams = Promise.resolve({ id: 'abc-123' })

describe('PATCH /api/admin/exercises/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    setupSupabaseMock({ userId: null })
    const res = await PATCH(makeRequest(VALID_BODY), { params: mockParams })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    setupSupabaseMock({ isAdmin: false })
    const res = await PATCH(makeRequest(VALID_BODY), { params: mockParams })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Forbidden')
  })

  it('returns 403 when origin is invalid', async () => {
    const { validateOrigin } = await import('@/lib/api-utils')
    vi.mocked(validateOrigin).mockReturnValueOnce(false)
    setupSupabaseMock()
    const res = await PATCH(makeRequest(VALID_BODY), { params: mockParams })
    expect(res.status).toBe(403)
  })

  it('returns 400 for empty prompt', async () => {
    setupSupabaseMock()
    const res = await PATCH(makeRequest({ ...VALID_BODY, prompt: '' }), { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('returns 400 for prompt exceeding 2000 chars', async () => {
    setupSupabaseMock()
    const res = await PATCH(makeRequest({ ...VALID_BODY, prompt: 'a'.repeat(2001) }), { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('returns 400 for hint_1 exceeding 500 chars', async () => {
    setupSupabaseMock()
    const res = await PATCH(makeRequest({ ...VALID_BODY, hint_1: 'x'.repeat(501) }), { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('returns 200 and { ok: true } on valid update', async () => {
    setupSupabaseMock()
    const res = await PATCH(makeRequest(VALID_BODY), { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('calls update on exercises table with correct data', async () => {
    setupSupabaseMock()
    await PATCH(makeRequest(VALID_BODY), { params: mockParams })
    expect(mockFrom).toHaveBeenCalledWith('exercises')
    expect(mockUpdate).toHaveBeenCalledWith(VALID_BODY)
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'abc-123')
  })

  it('returns 500 when the database update fails', async () => {
    setupSupabaseMock({ updateError: new Error('DB error') })
    const res = await PATCH(makeRequest(VALID_BODY), { params: mockParams })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to update exercise')
  })

  it('accepts null values for optional fields', async () => {
    setupSupabaseMock()
    const res = await PATCH(makeRequest({
      prompt: 'Test prompt',
      expected_answer: null,
      hint_1: null,
      hint_2: null,
    }), { params: mockParams })
    expect(res.status).toBe(200)
  })
})
