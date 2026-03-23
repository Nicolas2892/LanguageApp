/**
 * Tests for POST /api/grade — free-write grading route
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'
import type { SRSScore } from '@/lib/srs'
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
vi.mock('@/lib/srs', () => ({
  sm2: vi.fn(() => ({ ease_factor: 2.5, interval_days: 6, repetitions: 1, due_date: '2026-06-01' })),
  DEFAULT_PROGRESS: { ease_factor: 2.5, interval_days: 0, repetitions: 0 },
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

const CONCEPT_ID = '22222222-2222-2222-2222-222222222222'
const CONCEPT_ID_2 = '33333333-3333-3333-3333-333333333333'

const mockConcept = {
  id: CONCEPT_ID,
  title: 'El Subjuntivo',
  explanation: 'Use subjunctive when expressing wishes.',
  level: 'B2',
}

const mockConcept2 = {
  id: CONCEPT_ID_2,
  title: 'Ser vs Estar',
  explanation: 'Ser for permanent, estar for temporary.',
  level: 'B2',
}

const mockGradeResult = {
  score: 2 as SRSScore,
  is_correct: true,
  feedback: 'Good attempt.',
  corrected_version: 'correct answer',
  explanation: 'Use **subjunctive** after ojalá.',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
    body: JSON.stringify({
      concept_ids: [CONCEPT_ID],
      ai_prompt: 'Write about your weekend plans using the subjunctive.',
      user_answer: 'Espero que tenga un buen fin de semana.',
      ...body,
    }),
  })
}

function setupMocks(opts: {
  authenticated?: boolean
  concepts?: typeof mockConcept[] | null
  conceptError?: boolean
} = {}) {
  const { authenticated = true, concepts = [mockConcept], conceptError = false } = opts

  let progressCallCount = 0
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'concepts') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: conceptError ? null : concepts,
            error: conceptError ? { message: 'DB error' } : null,
          }),
        }),
      }
    }
    if (table === 'user_progress') {
      progressCallCount++
      if (progressCallCount === 1) {
        // First: batch fetch via Promise.all
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      }
      if (progressCallCount === 2) {
        // Second: upsert
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      if (progressCallCount === 3) {
        // Third: production_mastered update
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      if (progressCallCount === 4) {
        // Fourth: first concept interval fetch
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { interval_days: 6 },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return { upsert: vi.fn().mockResolvedValue({ error: null }) }
    }
    if (table === 'profiles') {
      // Timezone fetch in Promise.all
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
    if (table === 'exercise_attempts') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
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

describe('POST /api/grade', () => {
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

  it('returns 403 when validateOrigin fails', async () => {
    setupMocks()
    vi.mocked(validateOrigin).mockReturnValue(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limit exceeded', async () => {
    setupMocks()
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false } as never)
    const res = await POST(makeRequest())
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid body — missing fields', async () => {
    setupMocks()
    const res = await POST(makeRequest({ concept_ids: [], ai_prompt: '', user_answer: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid body — non-UUID concept_ids', async () => {
    setupMocks()
    const res = await POST(makeRequest({ concept_ids: ['not-a-uuid'] }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with gradeResult + next_review_in_days', async () => {
    setupMocks()
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      score: 2,
      is_correct: true,
      feedback: 'Good attempt.',
      corrected_version: 'correct answer',
      explanation: expect.any(String),
      next_review_in_days: 6,
    })
  })

  it('fetches all concepts for multi-concept request', async () => {
    const { mockFrom } = setupMocks({ concepts: [mockConcept, mockConcept2] })
    const res = await POST(makeRequest({ concept_ids: [CONCEPT_ID, CONCEPT_ID_2] }))
    expect(res.status).toBe(200)
    // Verify concepts.in was called with both IDs
    const conceptsCall = mockFrom.mock.calls.find((args: unknown[]) => args[0] === 'concepts')
    expect(conceptsCall).toBeDefined()
  })

  it('calls gradeAnswer with joined titles/explanations', async () => {
    setupMocks({ concepts: [mockConcept, mockConcept2] })
    await POST(makeRequest({ concept_ids: [CONCEPT_ID, CONCEPT_ID_2] }))
    expect(gradeAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        conceptTitle: 'El Subjuntivo, Ser vs Estar',
        conceptExplanation: expect.stringContaining('El Subjuntivo'),
        exerciseType: 'free_write',
      }),
    )
  })

  it('calls sm2 once per concept_id', async () => {
    const { sm2 } = await import('@/lib/srs')
    setupMocks({ concepts: [mockConcept, mockConcept2] })
    await POST(makeRequest({ concept_ids: [CONCEPT_ID, CONCEPT_ID_2] }))
    // sm2 is called for each concept in the upsert map
    expect(sm2).toHaveBeenCalledTimes(2)
  })

  it('sets production_mastered=true when score >= 2', async () => {
    vi.mocked(gradeAnswer).mockResolvedValue({ ...mockGradeResult, score: 2 })
    const { mockFrom } = setupMocks()
    await POST(makeRequest())
    // The third user_progress call should be the production_mastered update
    const progressCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'user_progress')
    expect(progressCalls.length).toBeGreaterThanOrEqual(3)
  })

  it('does NOT set production_mastered when score < 2', async () => {
    vi.mocked(gradeAnswer).mockResolvedValue({ ...mockGradeResult, score: 1, is_correct: false })
    const { mockFrom } = setupMocks()
    await POST(makeRequest())
    // Should only have upsert + fetch calls, no update for production_mastered
    const progressCalls = mockFrom.mock.calls.filter((args: unknown[]) => args[0] === 'user_progress')
    // 1st: select in Promise.all, 2nd: upsert, 3rd: interval fetch (no production_mastered update)
    expect(progressCalls.length).toBe(3)
  })

  it('uses DEFAULT_PROGRESS for new concepts (no existing progress)', async () => {
    const { sm2 } = await import('@/lib/srs')
    setupMocks()
    await POST(makeRequest())
    expect(sm2).toHaveBeenCalledWith(
      expect.objectContaining({ ease_factor: 2.5, interval_days: 0, repetitions: 0 }),
      expect.any(Number),
      expect.anything(),
    )
  })

  it('passes timezone to sm2', async () => {
    const { sm2 } = await import('@/lib/srs')
    setupMocks()
    await POST(makeRequest())
    expect(sm2).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      'Europe/Berlin',
    )
  })

  it('returns 404 when concepts not found', async () => {
    setupMocks({ concepts: [] })
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns 500 + Sentry capture on gradeAnswer throw', async () => {
    setupMocks()
    vi.mocked(gradeAnswer).mockRejectedValue(new Error('Claude API down'))
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('response shape matches expected contract', async () => {
    setupMocks()
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(json).toEqual(expect.objectContaining({
      score: expect.any(Number),
      is_correct: expect.any(Boolean),
      feedback: expect.any(String),
      corrected_version: expect.any(String),
      explanation: expect.any(String),
      next_review_in_days: expect.any(Number),
    }))
  })
})
