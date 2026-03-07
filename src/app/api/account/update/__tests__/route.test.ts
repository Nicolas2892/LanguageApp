import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/api-utils', () => ({ validateOrigin: vi.fn(() => true) }))

const mockEq = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

function setupSupabaseMock({ userId = 'user-1', dbError = null }: { userId?: string | null; dbError?: unknown } = {}) {
  mockGetUser.mockResolvedValue({ data: { user: userId ? { id: userId } : null } })
  mockEq.mockResolvedValue({ error: dbError })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ update: mockUpdate })
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  } as never)
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/account/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/account/update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Auth ---

  it('returns 401 when user is not authenticated', async () => {
    setupSupabaseMock({ userId: null })
    const res = await POST(makeRequest({ display_name: 'Test' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  // --- Validation: current_level is no longer accepted ---

  it('ignores current_level field (stripped by Zod) — only display_name counts as update', async () => {
    setupSupabaseMock()
    // current_level is unknown to schema, but display_name is valid → 200
    const res = await POST(makeRequest({ display_name: 'Test', current_level: 'B2' }))
    expect(res.status).toBe(200)
    // Only display_name reaches the DB; current_level is stripped
    expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'Test' })
  })

  it('returns 400 when only current_level is provided (no recognized fields)', async () => {
    setupSupabaseMock()
    // current_level is stripped → empty update object → 400
    const res = await POST(makeRequest({ current_level: 'B1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No fields to update')
  })

  // --- Validation: daily_goal_minutes ---

  it('returns 400 for daily_goal_minutes below minimum (4)', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ daily_goal_minutes: 4 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for daily_goal_minutes above maximum (121)', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ daily_goal_minutes: 121 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-integer daily_goal_minutes', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ daily_goal_minutes: 15.5 }))
    expect(res.status).toBe(400)
  })

  it('accepts daily_goal_minutes at boundary minimum (5)', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ daily_goal_minutes: 5 }))
    expect(res.status).toBe(200)
  })

  it('accepts daily_goal_minutes at boundary maximum (120)', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ daily_goal_minutes: 120 }))
    expect(res.status).toBe(200)
  })

  // --- Validation: display_name ---

  it('returns 400 for display_name longer than 50 characters', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ display_name: 'a'.repeat(51) }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty string display_name (min 1 char)', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ display_name: '' }))
    expect(res.status).toBe(400)
  })

  it('accepts display_name of exactly 50 characters', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ display_name: 'a'.repeat(50) }))
    expect(res.status).toBe(200)
  })

  // --- Empty update ---

  it('returns 400 when no fields are provided', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No fields to update')
  })

  // --- Partial updates ---

  it('accepts partial update with only display_name', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ display_name: 'Carlos' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'Carlos' })
  })

  it('accepts partial update with only daily_goal_minutes', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ daily_goal_minutes: 30 }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ daily_goal_minutes: 30 })
  })

  it('accepts full update with display_name and daily_goal_minutes', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({
      display_name: 'Ana',
      daily_goal_minutes: 30,
    }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({
      display_name: 'Ana',
      daily_goal_minutes: 30,
    })
  })

  it('calls update on the profiles table for the authenticated user', async () => {
    setupSupabaseMock({ userId: 'user-42' })
    await POST(makeRequest({ daily_goal_minutes: 20 }))
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockEq).toHaveBeenCalledWith('id', 'user-42')
  })

  it('returns { ok: true } on success', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ display_name: 'Test' }))
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  // --- DB error ---

  it('returns 500 when the database update fails', async () => {
    setupSupabaseMock({ dbError: new Error('Connection lost') })
    const res = await POST(makeRequest({ display_name: 'Test' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to update account')
  })

  // --- Validation: theme_preference ---

  it('accepts theme_preference "light"', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ theme_preference: 'light' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ theme_preference: 'light' })
  })

  it('accepts theme_preference "dark"', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ theme_preference: 'dark' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ theme_preference: 'dark' })
  })

  it('accepts theme_preference "system"', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ theme_preference: 'system' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ theme_preference: 'system' })
  })

  it('rejects invalid theme_preference value', async () => {
    setupSupabaseMock()
    const res = await POST(makeRequest({ theme_preference: 'auto' }))
    expect(res.status).toBe(400)
  })

  // --- Bad JSON ---

  it('returns 500 for completely malformed request body', async () => {
    setupSupabaseMock()
    const res = await POST(new Request('http://localhost/api/account/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json at all }{',
    }))
    expect(res.status).toBe(500)
  })
})
