/**
 * Tests for gradeAnswer() non-streaming function
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the claude client before importing grader
vi.mock('@/lib/claude/client', () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
  GRADE_MODEL: 'claude-haiku-4-5-20251001',
  TUTOR_MODEL: 'claude-sonnet-4-20250514',
}))

vi.mock('@/lib/exercises/gapFill', () => ({
  parseExpectedAnswers: vi.fn(() => null),
}))

import { anthropic } from '@/lib/claude/client'
import { gradeAnswer } from '@/lib/claude/grader'

function mockCreateResponse(json: string) {
  return { content: [{ type: 'text', text: json }] }
}

const BASE_PARAMS = {
  conceptTitle: 'El Subjuntivo',
  conceptExplanation: 'Use subjunctive when expressing wishes, doubts, or emotions.',
  exerciseType: 'gap_fill',
  prompt: 'Fill in: ___',
  expectedAnswer: 'haya',
  userAnswer: 'haya',
}

describe('gradeAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed GradeResult for valid JSON', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: 3,
        is_correct: true,
        feedback: 'Perfect answer.',
        corrected_version: 'haya',
        explanation: 'Correct use of subjunctive.',
      })) as never,
    )

    const result = await gradeAnswer(BASE_PARAMS)
    expect(result).toEqual({
      score: 3,
      is_correct: true,
      feedback: 'Perfect answer.',
      corrected_version: 'haya',
      explanation: 'Correct use of subjunctive.',
    })
  })

  it('uses GRADE_MODEL by default', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: 2, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
      })) as never,
    )

    await gradeAnswer(BASE_PARAMS)
    expect(anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5-20251001' }),
    )
  })

  it('accepts custom model override', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: 2, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
      })) as never,
    )

    await gradeAnswer({ ...BASE_PARAMS, model: 'claude-sonnet-4-20250514' })
    expect(anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-20250514' }),
    )
  })

  it('clamps score > 3 to 3', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: 5, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
      })) as never,
    )

    const result = await gradeAnswer(BASE_PARAMS)
    expect(result.score).toBe(3)
  })

  it('clamps score < 0 to 0', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: -1, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
      })) as never,
    )

    const result = await gradeAnswer(BASE_PARAMS)
    expect(result.score).toBe(0)
  })

  it('recalculates is_correct from clamped score', async () => {
    // Model returns score=1 with is_correct=true — should be recalculated to false
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: 1, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
      })) as never,
    )

    const result = await gradeAnswer(BASE_PARAMS)
    expect(result.score).toBe(1)
    expect(result.is_correct).toBe(false)
  })

  it('strips markdown fences before parsing', async () => {
    const json = JSON.stringify({
      score: 2, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
    })
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(`\`\`\`json\n${json}\n\`\`\``) as never,
    )

    const result = await gradeAnswer(BASE_PARAMS)
    expect(result.score).toBe(2)
    expect(result.is_correct).toBe(true)
  })

  it('falls back to score=0 when JSON is malformed', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse('not valid json {{{') as never,
    )

    const result = await gradeAnswer(BASE_PARAMS)
    expect(result.score).toBe(0)
    expect(result.is_correct).toBe(false)
    expect(result.feedback).toContain('Could not parse')
  })

  it('fallback corrected_version = expectedAnswer when provided', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse('invalid') as never,
    )

    const result = await gradeAnswer({ ...BASE_PARAMS, expectedAnswer: 'tenga' })
    expect(result.corrected_version).toBe('tenga')
  })

  it('fallback corrected_version = empty string when expectedAnswer is null', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse('invalid') as never,
    )

    const result = await gradeAnswer({ ...BASE_PARAMS, expectedAnswer: null })
    expect(result.corrected_version).toBe('')
  })

  it('truncates userAnswer to 1000 chars', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      mockCreateResponse(JSON.stringify({
        score: 2, is_correct: true, feedback: 'ok', corrected_version: 'haya', explanation: 'rule',
      })) as never,
    )

    const longAnswer = 'a'.repeat(2000)
    await gradeAnswer({ ...BASE_PARAMS, userAnswer: longAnswer })

    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: { content: string }[] }
    const userPrompt = callArgs.messages[0].content
    // The prompt should contain the truncated answer (1000 chars), not the full 2000
    expect(userPrompt).toContain('a'.repeat(1000))
    expect(userPrompt).not.toContain('a'.repeat(1001))
  })

  it('propagates error when API throws', async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(new Error('API timeout'))

    await expect(gradeAnswer(BASE_PARAMS)).rejects.toThrow('API timeout')
  })
})
