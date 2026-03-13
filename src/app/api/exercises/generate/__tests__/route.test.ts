import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'
import { clearRateLimitStore } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/claude/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({
          prompt: 'New prompt ___',
          expected_answer: 'respuesta',
          hint_1: 'Hint 1',
          hint_2: 'Hint 2',
          annotations: [{ text: 'New prompt ___', form: null }],
        }) }],
      }),
    },
  },
  TUTOR_MODEL: 'claude-test',
}))

vi.mock('@/lib/api-utils', () => ({
  validateOrigin: vi.fn(() => true),
}))

// Mock service role client
const mockServiceSelect = vi.fn()
const mockServiceInsertSelect = vi.fn()
const mockServiceInsertSingle = vi.fn()
const mockServiceInsert = vi.fn()
const mockServiceFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}))

const CONCEPT_ID = '11111111-1111-1111-1111-111111111111'

const mockExercise = {
  id: 'ex-1',
  concept_id: CONCEPT_ID,
  type: 'gap_fill',
  prompt: 'Existing prompt ___',
  expected_answer: 'existing answer',
  answer_variants: null,
  hint_1: null,
  hint_2: null,
  annotations: null,
  source: 'seed',
  created_at: '2026-01-01T00:00:00Z',
}

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq2 = vi.fn()
const mockEq1 = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/exercises/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupMocks({ exerciseCount = 3, conceptExists = true }: { exerciseCount?: number; conceptExists?: boolean } = {}) {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

  // Auth client: concepts query
  mockSingle.mockResolvedValue({
    data: conceptExists ? { id: CONCEPT_ID, title: 'Test concept', explanation: 'Explanation', examples: [] } : null,
  })
  mockEq2.mockReturnValue({ single: mockSingle })
  mockEq1.mockReturnValue({ eq: mockEq2, single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq1 })
  mockFrom.mockReturnValue({ select: mockSelect })

  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  } as never)

  // Service role client: exercises queries
  const existingExercises = Array.from({ length: exerciseCount }, (_, i) => ({
    ...mockExercise,
    id: `ex-${i}`,
    prompt: `Existing prompt ${i} ___`,
  }))

  mockServiceInsertSingle.mockResolvedValue({
    data: { ...mockExercise, id: 'new-ex', prompt: 'New prompt ___', source: 'ai_generated' },
    error: null,
  })
  mockServiceInsertSelect.mockReturnValue({ single: mockServiceInsertSingle })
  mockServiceInsert.mockReturnValue({ select: mockServiceInsertSelect })
  const mockLimit = vi.fn().mockResolvedValue({ data: existingExercises })
  mockServiceSelect.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: mockLimit,
      }),
    }),
  })

  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'exercises') {
      return {
        select: mockServiceSelect,
        insert: mockServiceInsert,
      }
    }
    return {}
  })
}

describe('POST /api/exercises/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRateLimitStore()
  })

  it('returns 403 when origin validation fails', async () => {
    setupMocks()
    vi.mocked(validateOrigin).mockReturnValue(false)
    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Forbidden')
    vi.mocked(validateOrigin).mockReturnValue(true)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never)

    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid type', async () => {
    setupMocks()
    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'invalid_type' }))
    expect(res.status).toBe(400)
  })

  it('returns cached exercise when at cap (15)', async () => {
    setupMocks({ exerciseCount: 15 })
    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cached).toBe(true)
    // Should NOT have called Claude
    const { anthropic } = await import('@/lib/claude/client')
    expect(anthropic.messages.create).not.toHaveBeenCalled()
  })

  it('generates new exercise when under cap', async () => {
    setupMocks({ exerciseCount: 3 })
    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.source).toBe('ai_generated')
  })

  it('bypasses cap when force is true', async () => {
    setupMocks({ exerciseCount: 15 })
    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill', force: true }))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Should have called Claude since force=true
    const { anthropic } = await import('@/lib/claude/client')
    expect(anthropic.messages.create).toHaveBeenCalled()
  })

  it('returns 404 when concept does not exist', async () => {
    setupMocks({ exerciseCount: 0, conceptExists: false })
    const res = await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    expect(res.status).toBe(404)
  })

  it('sets source to ai_generated on new exercises', async () => {
    setupMocks({ exerciseCount: 0 })
    await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    expect(mockServiceInsert).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'ai_generated' }),
    )
  })

  it('applies .limit(CAP + 1) on cap check query', async () => {
    setupMocks({ exerciseCount: 3 })
    await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    // The mock chain: mockServiceSelect → .eq() → .eq() → .limit()
    // Verify limit was called with EXERCISE_CAP_PER_TYPE + 1 = 16
    const limitCalls = mockServiceSelect.mock.results[0]?.value.eq.mock.results[0]?.value.eq.mock.results[0]?.value.limit.mock.calls
    expect(limitCalls).toHaveLength(1)
    expect(limitCalls[0][0]).toBe(16) // EXERCISE_CAP_PER_TYPE (15) + 1
  })

  it('passes existing prompts as dedup context to Claude', async () => {
    setupMocks({ exerciseCount: 3 })
    await POST(makeRequest({ concept_id: CONCEPT_ID, type: 'gap_fill' }))
    const { anthropic } = await import('@/lib/claude/client')
    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0]?.[0]
    const messageContent = (callArgs?.messages[0]?.content ?? '') as string
    expect(messageContent).toContain('Existing prompt 0')
    expect(messageContent).toContain('DIFFERENT')
  })
})
