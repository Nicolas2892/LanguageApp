import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

// Mock Supabase
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLt = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    streak: 5,
                    streak_freeze_remaining: 1,
                    streak_freeze_used_date: null,
                    last_studied_date: '2026-03-15',
                    timezone: 'Europe/Berlin',
                  },
                }),
            }),
          }),
        }
      }
      if (table === 'exercise_attempts') {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lt: () =>
                  Promise.resolve({
                    data: [
                      { created_at: '2026-03-10T14:30:00Z' },
                      { created_at: '2026-03-10T20:00:00Z' },
                      { created_at: '2026-03-12T08:00:00Z' },
                      { created_at: '2026-03-15T23:30:00Z' },
                    ],
                  }),
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    }),
  }),
}))

vi.mock('@/lib/claude/client', () => ({
  default: {},
  TUTOR_MODEL: 'test',
  GRADE_MODEL: 'test',
}))

describe('GET /api/streak/calendar', () => {
  it('returns studied dates and streak data for a valid month', async () => {
    const request = new Request('http://localhost:3000/api/streak/calendar?month=2026-03')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.streak).toBe(5)
    expect(json.freezeRemaining).toBe(1)
    expect(json.freezeUsedDate).toBeNull()
    expect(json.lastStudiedDate).toBe('2026-03-15')
    // Dates should be deduplicated (2 attempts on Mar 10 → 1 date)
    expect(json.studiedDates).toContain('2026-03-10')
    expect(json.studiedDates).toContain('2026-03-12')
    expect(json.studiedDates).toContain('2026-03-16') // Mar 15 23:30 UTC = Mar 16 in Europe/Berlin
    expect(Array.isArray(json.studiedDates)).toBe(true)
  })

  it('returns 400 for invalid month format', async () => {
    const request = new Request('http://localhost:3000/api/streak/calendar?month=2026-13')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 for malformed month param', async () => {
    const request = new Request('http://localhost:3000/api/streak/calendar?month=march')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('defaults to current month when no month param provided', async () => {
    const request = new Request('http://localhost:3000/api/streak/calendar')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})

describe('GET /api/streak/calendar — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    // Override the mock for this test
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    } as any)

    const request = new Request('http://localhost:3000/api/streak/calendar')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
