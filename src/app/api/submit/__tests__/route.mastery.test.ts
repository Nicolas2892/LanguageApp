/**
 * UX-AA: Tests for the just_mastered flag in POST /api/submit
 *
 * These tests focus on the mastery threshold crossing logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'

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
import type { SRSScore } from '@/lib/srs'

const MASTERY_THRESHOLD = 21

const EXERCISE_ID = '11111111-1111-1111-1111-111111111111'
const CONCEPT_ID = '22222222-2222-2222-2222-222222222222'

const mockExercise = {
  id: EXERCISE_ID,
  type: 'gap_fill',
  prompt: 'Test prompt ___',
  expected_answer: 'answer',
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

const mockGradeResult = {
  score: 3 as SRSScore,
  is_correct: true,
  feedback: 'Perfecto!',
  corrected_version: '',
  explanation: 'Great.',
}

function setupMocks(prevIntervalDays: number, newIntervalDays: number) {
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
                  data: { ease_factor: 2.5, interval_days: prevIntervalDays, repetitions: 3, due_date: '2026-01-01', production_mastered: false },
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

  vi.mocked(gradeAnswer).mockResolvedValue(mockGradeResult)

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
  })

  it('returns just_mastered: false when prev interval already >= threshold', async () => {
    setupMocks(MASTERY_THRESHOLD, MASTERY_THRESHOLD + 10)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.just_mastered).toBe(false)
    expect(body.mastered_concept_title).toBeNull()
  })

  it('returns just_mastered: false when new interval is still < threshold', async () => {
    setupMocks(5, 10)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.just_mastered).toBe(false)
  })

  it('returns just_mastered: true with concept title when crossing the threshold', async () => {
    setupMocks(15, MASTERY_THRESHOLD)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.just_mastered).toBe(true)
    expect(body.mastered_concept_title).toBe('El Subjuntivo')
  })

  it('returns just_mastered: false when skip_srs is true', async () => {
    setupMocks(15, MASTERY_THRESHOLD)
    const res = await POST(makeRequest({ skip_srs: true }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.just_mastered).toBe(false)
    expect(body.mastered_concept_title).toBeNull()
  })
})
