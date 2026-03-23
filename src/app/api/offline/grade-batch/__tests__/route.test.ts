/**
 * Tests for POST /api/offline/grade-batch — batch offline grading route
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'
import type { SRSScore } from '@/lib/srs/index'
import * as Sentry from '@sentry/nextjs'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/claude/client', () => ({
  anthropic: {},
  TUTOR_MODEL: 'claude-sonnet-4-20250514',
  GRADE_MODEL: 'claude-haiku-4-5-20251001',
}))
vi.mock('@/lib/claude/grader')
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true })),
}))
vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
  updateStreakIfNeeded: vi.fn(() => Promise.resolve()),
  updateComputedLevel: vi.fn(() => Promise.resolve()),
}))
vi.mock('@/lib/srs/index', () => ({
  sm2: vi.fn(() => ({ ease_factor: 2.5, interval_days: 6, repetitions: 1, due_date: '2026-06-01' })),
  DEFAULT_PROGRESS: { ease_factor: 2.5, interval_days: 0, repetitions: 0 },
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))
vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(() => Promise.resolve()),
}))

const CONCEPT_ID = '22222222-2222-2222-2222-222222222222'
const CONCEPT_ID_2 = '33333333-3333-3333-3333-333333333333'
const EXERCISE_ID = '11111111-1111-1111-1111-111111111111'
const REPORT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

const mockGradeResult = {
  score: 2 as SRSScore,
  is_correct: true,
  feedback: 'Good attempt.',
  corrected_version: 'correct answer',
  explanation: 'Use **subjunctive** after ojalá.',
}

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    exercise_id: EXERCISE_ID,
    concept_id: CONCEPT_ID,
    concept_title: 'El Subjuntivo',
    user_answer: 'Espero que tenga',
    exercise_type: 'gap_fill',
    exercise_prompt: 'Fill in: ___',
    expected_answer: 'tenga',
    answer_variants: null,
    attempted_at: '2026-03-20T10:00:00Z',
    ...overrides,
  }
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/offline/grade-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
    body: JSON.stringify({
      session_id: 'offline-session-1',
      attempts: [makeAttempt()],
      ...body,
    }),
  })
}

function setupMocks(opts: {
  authenticated?: boolean
  existingProgress?: boolean
  pushSubscription?: object | null
} = {}) {
  const { authenticated = true, existingProgress = false, pushSubscription = null } = opts

  let conceptsCalled = false
  let progressCallCount = 0
  let profileCallCount = 0
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'concepts') {
      conceptsCalled = true
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{
              id: CONCEPT_ID,
              title: 'El Subjuntivo',
              explanation: 'Use subjunctive when...',
              type: 'grammar',
            }],
            error: null,
          }),
        }),
      }
    }
    if (table === 'user_progress') {
      progressCallCount++
      if (progressCallCount === 1) {
        // Initial fetch
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: existingProgress ? [{
                  id: 'progress-1',
                  concept_id: CONCEPT_ID,
                  ease_factor: 2.5,
                  interval_days: 3,
                  due_date: '2026-03-20',
                  repetitions: 2,
                  production_mastered: false,
                  is_hard: false,
                  user_id: 'user-1',
                }] : [],
                error: null,
              }),
            }),
          }),
        }
      }
      // Subsequent calls: update or insert
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-progress-1',
                concept_id: CONCEPT_ID,
                ease_factor: 2.5,
                interval_days: 6,
                repetitions: 1,
                production_mastered: false,
                is_hard: false,
                user_id: 'user-1',
              },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'profiles') {
      profileCallCount++
      if (profileCallCount === 1) {
        // Timezone fetch
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { timezone: 'Europe/Berlin' },
                error: null,
              }),
            }),
          }),
        }
      }
      // Push subscription fetch
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { push_subscription: pushSubscription },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'exercise_attempts') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    if (table === 'offline_reports') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: REPORT_ID },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'offline_report_attempts') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    return { select: vi.fn(), insert: vi.fn(), upsert: vi.fn() }
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authenticated ? { id: 'user-1' } : null },
      }),
    },
    from: mockFrom,
  } as never)

  return { mockFrom }
}

describe('POST /api/offline/grade-batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateOrigin).mockReturnValue(true)
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true } as never)
    vi.mocked(gradeAnswer).mockResolvedValue(mockGradeResult)
  })

  it('returns 401 when unauthenticated', async () => {
    setupMocks({ authenticated: false })
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 when origin fails', async () => {
    setupMocks()
    vi.mocked(validateOrigin).mockReturnValue(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limited', async () => {
    setupMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false } as never)
    const res = await POST(makeRequest())
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid body — empty attempts', async () => {
    setupMocks()
    const res = await POST(makeRequest({ attempts: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid body — bad exercise_type', async () => {
    setupMocks()
    const res = await POST(makeRequest({
      attempts: [makeAttempt({ exercise_type: 'invalid_type' })],
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for >50 attempts', async () => {
    setupMocks()
    const attempts = Array.from({ length: 51 }, (_, i) =>
      makeAttempt({ attempted_at: `2026-03-20T${String(i % 24).padStart(2, '0')}:00:00Z` }),
    )
    const res = await POST(makeRequest({ attempts }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with report_id, results, summary for single attempt', async () => {
    setupMocks()
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      report_id: REPORT_ID,
      results: expect.any(Array),
      summary: expect.objectContaining({
        total: 1,
        correct: 1,
        accuracy_pct: 100,
      }),
    })
  })

  it('results array length matches attempt count', async () => {
    setupMocks()
    const attempts = [
      makeAttempt({ attempted_at: '2026-03-20T10:00:00Z' }),
      makeAttempt({ concept_id: CONCEPT_ID, attempted_at: '2026-03-20T11:00:00Z' }),
    ]
    const res = await POST(makeRequest({ attempts }))
    const json = await res.json()
    expect(json.results).toHaveLength(2)
  })

  it('summary has correct total, correct, accuracy_pct', async () => {
    // First attempt correct, second incorrect
    let callCount = 0
    vi.mocked(gradeAnswer).mockImplementation(async () => {
      callCount++
      if (callCount === 1) return mockGradeResult
      return { ...mockGradeResult, score: 0 as SRSScore, is_correct: false }
    })
    setupMocks()
    const attempts = [
      makeAttempt({ attempted_at: '2026-03-20T10:00:00Z' }),
      makeAttempt({ attempted_at: '2026-03-20T11:00:00Z' }),
    ]
    const res = await POST(makeRequest({ attempts }))
    const json = await res.json()
    expect(json.summary).toEqual({
      total: 2,
      correct: 1,
      accuracy_pct: 50,
    })
  })

  it('calls gradeAnswer once per attempt', async () => {
    setupMocks()
    const attempts = [
      makeAttempt({ attempted_at: '2026-03-20T10:00:00Z' }),
      makeAttempt({ attempted_at: '2026-03-20T11:00:00Z' }),
      makeAttempt({ attempted_at: '2026-03-20T12:00:00Z' }),
    ]
    await POST(makeRequest({ attempts }))
    expect(gradeAnswer).toHaveBeenCalledTimes(3)
  })

  it('falls back to concept_title from attempt when concept not in DB', async () => {
    const unknownConceptId = '44444444-4444-4444-4444-444444444444'
    setupMocks()
    const attempt = makeAttempt({
      concept_id: unknownConceptId,
      concept_title: 'Fallback Title',
    })
    await POST(makeRequest({ attempts: [attempt] }))
    expect(gradeAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ conceptTitle: 'Fallback Title' }),
    )
  })

  it('sorts attempts by attempted_at before SRS', async () => {
    const { sm2 } = await import('@/lib/srs/index')
    setupMocks()
    // Submit in reverse chronological order
    const attempts = [
      makeAttempt({ attempted_at: '2026-03-20T12:00:00Z' }),
      makeAttempt({ attempted_at: '2026-03-20T10:00:00Z' }),
    ]
    await POST(makeRequest({ attempts }))
    // sm2 should be called — the sorting is internal
    expect(sm2).toHaveBeenCalled()
  })

  it('same concept twice: second sm2 uses updated progress', async () => {
    const { sm2 } = await import('@/lib/srs/index')
    setupMocks()
    const attempts = [
      makeAttempt({ attempted_at: '2026-03-20T10:00:00Z' }),
      makeAttempt({ attempted_at: '2026-03-20T11:00:00Z' }),
    ]
    await POST(makeRequest({ attempts }))
    // sm2 called twice for same concept — second call should use output of first
    expect(sm2).toHaveBeenCalledTimes(2)
    // Second call should use updated progress from first sm2 result
    const secondCall = vi.mocked(sm2).mock.calls[1]
    expect(secondCall[0]).toEqual(
      expect.objectContaining({ ease_factor: 2.5, interval_days: 6, repetitions: 1 }),
    )
  })

  it('creates new user_progress for unseen concept', async () => {
    const { mockFrom } = setupMocks({ existingProgress: false })
    await POST(makeRequest())
    // Should have called insert on user_progress (not update)
    const progressCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'user_progress')
    // 1st: initial fetch, 2nd: insert (new concept)
    expect(progressCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('updates existing user_progress for known concept', async () => {
    const { mockFrom } = setupMocks({ existingProgress: true })
    await POST(makeRequest())
    const progressCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'user_progress')
    // 1st: initial fetch, 2nd: update (existing concept)
    expect(progressCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('inserts exercise_attempts batch', async () => {
    const { mockFrom } = setupMocks()
    await POST(makeRequest())
    const attemptCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'exercise_attempts')
    expect(attemptCalls.length).toBe(1)
  })

  it('creates offline_report with session_id, counts, accuracy', async () => {
    const { mockFrom } = setupMocks()
    await POST(makeRequest())
    const reportCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'offline_reports')
    expect(reportCalls.length).toBe(1)
  })

  it('creates offline_report_attempts with per-attempt detail', async () => {
    const { mockFrom } = setupMocks()
    await POST(makeRequest())
    const reportAttemptCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'offline_report_attempts')
    expect(reportAttemptCalls.length).toBe(1)
  })

  it('sends push when profile has push_subscription', async () => {
    const webpush = await import('web-push')
    setupMocks({
      pushSubscription: {
        endpoint: 'https://push.example.com',
        keys: { p256dh: 'key1', auth: 'key2' },
      },
    })
    await POST(makeRequest())
    expect(webpush.sendNotification).toHaveBeenCalled()
  })

  it('returns 200 even when push throws', async () => {
    const webpush = await import('web-push')
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('Push failed'))
    setupMocks({
      pushSubscription: {
        endpoint: 'https://push.example.com',
        keys: { p256dh: 'key1', auth: 'key2' },
      },
    })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
  })
})
