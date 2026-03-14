/**
 * UX-AA: Tests for the just_mastered flag in POST /api/submit
 *
 * These tests focus on the mastery threshold crossing logic.
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
  sm2: vi.fn(),
  DEFAULT_PROGRESS: { ease_factor: 2.5, interval_days: 0, repetitions: 0 },
}))

import { sm2 } from '@/lib/srs'
import { clearCache } from '@/lib/cache'
import type { SRSScore } from '@/lib/srs'

const MASTERY_THRESHOLD = 21

const EXERCISE_ID = '11111111-1111-1111-1111-111111111111'
const CONCEPT_ID = '22222222-2222-2222-2222-222222222222'

const mockExercise = {
  id: EXERCISE_ID,
  type: 'gap_fill',
  prompt: 'Test prompt ___',
  expected_answer: 'answer',
  answer_variants: null,
  concept_id: CONCEPT_ID,
  annotations: null,
  hint_1: null,
  hint_2: null,
}

const mockConcept = {
  id: CONCEPT_ID,
  title: 'El Subjuntivo',
  explanation: 'Use subjunctive when...',
  level: 'B2',
  type: 'grammar',
  difficulty: 2,
  grammar_focus: 'subjunctive',
  unit_id: 'unit-1',
  examples: [],
}

const mockScoreChunk: ScoreChunk = {
  type: 'score',
  score: 3 as SRSScore,
  is_correct: true,
}

const mockDetailsChunk: DetailsChunk = {
  type: 'details',
  feedback: 'Perfecto!',
  corrected_version: '',
  explanation: 'Great.',
}

/** Read a streaming Response body and return the merged object from both NDJSON lines */
async function readNDJSONMerged(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  const lines = text.split('\n').filter((l) => l.trim())
  return Object.assign({}, ...lines.map((l) => JSON.parse(l) as object)) as Record<string, unknown>
}

function makeStreamGen(scoreChunk = mockScoreChunk, detailsChunk = mockDetailsChunk) {
  return (async function* () {
    yield scoreChunk
    yield detailsChunk
  })()
}

function setupMocks(prevIntervalDays: number, newIntervalDays: number, opts?: { is_hard?: boolean }) {
  let callCount = 0
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
      callCount++
      if (callCount === 1) {
        // First call: fetch existing progress
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ease_factor: 2.5, interval_days: prevIntervalDays, repetitions: 3, due_date: '2026-01-01', production_mastered: false, is_hard: opts?.is_hard ?? false },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      // Subsequent calls: upsert / update
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }
    }
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { timezone: null }, error: null }),
          }),
        }),
      }
    }
    if (table === 'exercise_attempts') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }
    return { select: vi.fn(), insert: vi.fn(), upsert: vi.fn(), update: vi.fn() }
  })

  vi.mocked(sm2).mockReturnValue({
    ease_factor: 2.5,
    interval_days: newIntervalDays,
    repetitions: 4,
    due_date: '2026-06-01',
  })

  vi.mocked(gradeAnswerStream).mockImplementation(() => makeStreamGen())

  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: mockFrom,
  } as never)
}

function makeRequest(extra: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost' },
    body: JSON.stringify({ exercise_id: EXERCISE_ID, concept_id: CONCEPT_ID, user_answer: 'test', ...extra }),
  })
}

describe('POST /api/submit — UX-AA just_mastered flag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache()
  })

  it('returns just_mastered: false when prev interval already >= threshold', async () => {
    setupMocks(MASTERY_THRESHOLD, MASTERY_THRESHOLD + 10)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await readNDJSONMerged(res)
    expect(body.just_mastered).toBe(false)
    expect(body.mastered_concept_title).toBeNull()
  })

  it('returns just_mastered: false when new interval is still < threshold', async () => {
    setupMocks(5, 10)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await readNDJSONMerged(res)
    expect(body.just_mastered).toBe(false)
  })

  it('returns just_mastered: true with concept title when crossing the threshold', async () => {
    setupMocks(15, MASTERY_THRESHOLD)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await readNDJSONMerged(res)
    expect(body.just_mastered).toBe(true)
    expect(body.mastered_concept_title).toBe('El Subjuntivo')
  })

  it('returns just_mastered: true even when is_hard multiplier would reduce interval below threshold', async () => {
    // SM-2 returns 21 (exactly at threshold), but hard-flag multiplier would reduce to 13.
    // Mastery check must happen BEFORE the multiplier is applied.
    setupMocks(15, MASTERY_THRESHOLD, { is_hard: true })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await readNDJSONMerged(res)
    expect(body.just_mastered).toBe(true)
    expect(body.mastered_concept_title).toBe('El Subjuntivo')
  })

  it('returns just_mastered: false when skip_srs is true', async () => {
    setupMocks(15, MASTERY_THRESHOLD)
    const res = await POST(makeRequest({ skip_srs: true }))
    expect(res.status).toBe(200)
    const body = await readNDJSONMerged(res)
    expect(body.just_mastered).toBe(false)
    expect(body.mastered_concept_title).toBeNull()
  })
})
