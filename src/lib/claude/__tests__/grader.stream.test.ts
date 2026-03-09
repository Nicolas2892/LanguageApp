/**
 * Perf-A: Tests for gradeAnswerStream() async generator
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GRADE_MODEL } from '@/lib/claude/client'

// Mock the claude client before importing grader
vi.mock('@/lib/claude/client', () => ({
  anthropic: {
    messages: {
      stream: vi.fn(),
    },
  },
  GRADE_MODEL: 'claude-haiku-4-5-20251001',
  TUTOR_MODEL: 'claude-sonnet-4-20250514',
}))

// Mock parseExpectedAnswers
vi.mock('@/lib/exercises/gapFill', () => ({
  parseExpectedAnswers: vi.fn(() => null),
}))

import { anthropic } from '@/lib/claude/client'
import { gradeAnswerStream } from '@/lib/claude/grader'
import type { ScoreChunk, DetailsChunk } from '@/lib/claude/grader'

/** Build a fake async iterable from an array of stream events */
function makeAsyncStream(events: object[]) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0
      return {
        async next() {
          if (i >= events.length) return { done: true as const, value: undefined }
          return { done: false as const, value: events[i++] }
        },
      }
    },
  }
}

function textEvent(text: string) {
  return { type: 'content_block_delta', delta: { type: 'text_delta', text } }
}

const BASE_PARAMS = {
  conceptTitle: 'El Subjuntivo',
  conceptExplanation: 'Use subjunctive when...',
  exerciseType: 'gap_fill',
  prompt: 'Fill in: ___',
  expectedAnswer: 'haya',
  userAnswer: 'haya',
}

describe('gradeAnswerStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('yields ScoreChunk then DetailsChunk for a well-formed two-line response', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('{"score":2,"is_correct":true}\n'),
        textEvent('{"feedback":"Good!","corrected_version":"haya","explanation":"Correct use."}'),
      ]) as never,
    )

    const gen = gradeAnswerStream(BASE_PARAMS)

    const first = await gen.next()
    expect(first.done).toBe(false)
    expect(first.value).toMatchObject<ScoreChunk>({ type: 'score', score: 2, is_correct: true })

    const second = await gen.next()
    expect(second.done).toBe(false)
    expect(second.value).toMatchObject<DetailsChunk>({
      type: 'details',
      feedback: 'Good!',
      corrected_version: 'haya',
      explanation: 'Correct use.',
    })
  })

  it('handles score JSON split across multiple token chunks', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('{"score":3'),
        textEvent(',"is_correct":true}\n'),
        textEvent('{"feedback":"Perfect!","corrected_version":"","explanation":"Spot on."}'),
      ]) as never,
    )

    const gen = gradeAnswerStream(BASE_PARAMS)
    const first = await gen.next()
    expect((first.value as ScoreChunk).score).toBe(3)
    expect((first.value as ScoreChunk).is_correct).toBe(true)

    const second = await gen.next()
    expect((second.value as DetailsChunk).feedback).toBe('Perfect!')
  })

  it('clamps score to valid 0–3 range', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('{"score":99,"is_correct":true}\n'),
        textEvent('{"feedback":"ok","corrected_version":"","explanation":""}'),
      ]) as never,
    )

    const gen = gradeAnswerStream(BASE_PARAMS)
    const first = await gen.next()
    expect((first.value as ScoreChunk).score).toBe(3)
  })

  it('falls back to score=0 and error details when score JSON is malformed', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('NOT VALID JSON\n'),
        textEvent('{"feedback":"ok","corrected_version":"","explanation":""}'),
      ]) as never,
    )

    const gen = gradeAnswerStream(BASE_PARAMS)
    const first = await gen.next()
    expect((first.value as ScoreChunk).score).toBe(0)
    expect((first.value as ScoreChunk).is_correct).toBe(false)

    const second = await gen.next()
    expect((second.value as DetailsChunk).feedback).toBe('Could not grade answer.')
  })

  it('falls back gracefully when details JSON is malformed', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('{"score":1,"is_correct":false}\n'),
        textEvent('BROKEN DETAILS'),
      ]) as never,
    )

    const gen = gradeAnswerStream(BASE_PARAMS)
    const first = await gen.next()
    expect((first.value as ScoreChunk).score).toBe(1)

    const second = await gen.next()
    expect((second.value as DetailsChunk).feedback).toBe('Could not grade answer.')
  })

  it('falls back when stream throws', async () => {
    vi.mocked(anthropic.messages.stream).mockRejectedValue(new Error('API error'))

    const gen = gradeAnswerStream(BASE_PARAMS)
    const first = await gen.next()
    expect((first.value as ScoreChunk).score).toBe(0)

    const second = await gen.next()
    expect((second.value as DetailsChunk).feedback).toBe('Could not grade answer.')
  })

  it('uses GRADE_MODEL by default', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('{"score":2,"is_correct":true}\n'),
        textEvent('{"feedback":"ok","corrected_version":"","explanation":""}'),
      ]) as never,
    )

    const gen = gradeAnswerStream(BASE_PARAMS)
    // Advance to first yield — triggers anthropic.messages.stream call
    await gen.next()

    expect(vi.mocked(anthropic.messages.stream)).toHaveBeenCalledWith(
      expect.objectContaining({ model: GRADE_MODEL }),
    )
  })

  it('accepts a custom model override', async () => {
    vi.mocked(anthropic.messages.stream).mockResolvedValue(
      makeAsyncStream([
        textEvent('{"score":3,"is_correct":true}\n'),
        textEvent('{"feedback":"ok","corrected_version":"","explanation":""}'),
      ]) as never,
    )

    const gen = gradeAnswerStream({ ...BASE_PARAMS, model: 'custom-model' })
    await gen.next()

    expect(vi.mocked(anthropic.messages.stream)).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'custom-model' }),
    )
  })
})
