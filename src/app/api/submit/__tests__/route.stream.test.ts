/**
 * Perf-A: Tests for streaming NDJSON response from POST /api/submit
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswerStream } from '@/lib/claude/grader'
import type { ScoreChunk, DetailsChunk } from '@/lib/claude/grader'

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
vi.mock('@/lib/mastery/computeLevel', () => ({
  PRODUCTION_TYPES: ['translation', 'transformation', 'free_write'],
}))
vi.mock('@/lib/srs', () => ({
  sm2: vi.fn(() => ({ ease_factor: 2.5, interval_days: 6, repetitions: 1, due_date: '2026-06-01' })),
  DEFAULT_PROGRESS: { ease_factor: 2.5, interval_days: 0, repetitions: 0 },
}))

const EXERCISE_ID = '11111111-1111-1111-1111-111111111111'
const CONCEPT_ID = '22222222-2222-2222-2222-222222222222'

const mockExercise = {
  id: EXERCISE_ID,
  type: 'gap_fill',
  prompt: 'Test ___',
  expected_answer: 'answer',
  concept_id: CONCEPT_ID,
  annotations: null,
  hint_1: null,
  hint_2: null,
}

const mockConcept = {
  id: CONCEPT_ID,
  title: 'El Subjuntivo',
  explanation: 'Use subjunctive...',
  level: 'B2',
  type: 'grammar',
  difficulty: 2,
  grammar_focus: 'subjunctive',
  unit_id: 'unit-1',
  examples: [],
}

/** Read a streaming Response body and return parsed NDJSON lines */
async function readNDJSON(res: Response): Promise<Record<string, unknown>[]> {
  const text = await res.text()
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Record<string, unknown>)
}

function makeStreamGen(scoreChunk: ScoreChunk, detailsChunk: DetailsChunk) {
  return (async function* () {
    yield scoreChunk
    yield detailsChunk
  })()
}

function setupMocks(opts: { prevIntervalDays?: number } = {}) {
  const prevIntervalDays = opts.prevIntervalDays ?? 0

  const upsertMock = vi.fn().mockResolvedValue({ error: null })

  let progressCallCount = 0
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'exercises') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockExercise, error: null }),
            }),
          }),
        }),
      }
    }
    if (table === 'concepts') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockConcept, error: null }),
          }),
        }),
      }
    }
    if (table === 'user_progress') {
      progressCallCount++
      if (progressCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ease_factor: 2.5, interval_days: prevIntervalDays, repetitions: 0, due_date: '2026-01-01', production_mastered: false, is_hard: false },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return { upsert: upsertMock, update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) }
    }
    if (table === 'exercise_attempts') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    return { select: vi.fn(), insert: vi.fn(), upsert: vi.fn() }
  })

  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: mockFrom,
  } as never)

  return { upsertMock }
}

function makeRequest(extra: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
    body: JSON.stringify({ exercise_id: EXERCISE_ID, concept_id: CONCEPT_ID, user_answer: 'test', ...extra }),
  })
}

describe('POST /api/submit — Perf-A streaming NDJSON', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
    vi.mocked(gradeAnswerStream).mockImplementation(() =>
      makeStreamGen(
        { type: 'score', score: 2, is_correct: true },
        { type: 'details', feedback: 'Good attempt!', corrected_version: 'test', explanation: 'Well done.' },
      ),
    )
  })

  it('response Content-Type is application/x-ndjson', async () => {
    const res = await POST(makeRequest())
    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson')
  })

  it('first NDJSON line contains score + SRS fields', async () => {
    const res = await POST(makeRequest())
    const [chunk1] = await readNDJSON(res)
    expect(chunk1).toMatchObject({
      score: 2,
      is_correct: true,
      next_review_in_days: expect.any(Number),
      just_mastered: expect.any(Boolean),
      mastered_concept_title: null,
    })
  })

  it('second NDJSON line contains feedback fields', async () => {
    const res = await POST(makeRequest())
    const [, chunk2] = await readNDJSON(res)
    expect(chunk2).toMatchObject({
      feedback: 'Good attempt!',
      corrected_version: 'test',
      explanation: 'Well done.',
    })
  })

  it('skip_srs=true omits SM-2 write and sets next_review_in_days=0', async () => {
    const { upsertMock } = setupMocks()
    vi.mocked(gradeAnswerStream).mockImplementation(() =>
      makeStreamGen(
        { type: 'score', score: 3, is_correct: true },
        { type: 'details', feedback: 'Perfect!', corrected_version: '', explanation: '' },
      ),
    )

    const res = await POST(makeRequest({ skip_srs: true }))
    const [chunk1] = await readNDJSON(res)
    expect(chunk1.next_review_in_days).toBe(0)
    // upsert should not have been called
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('returns 200 with two lines for a valid request', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const lines = await readNDJSON(res)
    expect(lines).toHaveLength(2)
  })

  it('returns 401 for unauthenticated request', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    } as never)

    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 for invalid request body', async () => {
    const req = new Request('http://localhost/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
      body: JSON.stringify({ bad: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when exercise is not found', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockConcept, error: null }),
            }),
          }),
        }
      }),
    } as never)

    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
  })
})
