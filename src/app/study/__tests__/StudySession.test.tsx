import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudySession } from '../StudySession'
import type { StudyItem } from '../StudySession'
import type { Concept, Exercise } from '@/lib/supabase/types'

// ── Router mock ──────────────────────────────────────────────────────────────
let mockRouter: { push: ReturnType<typeof vi.fn>; prefetch: ReturnType<typeof vi.fn> }
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// ── Sub-component mocks ───────────────────────────────────────────────────────
vi.mock('@/components/exercises/ExerciseRenderer', () => ({
  ExerciseRenderer: ({ onSubmit }: { onSubmit: (a: string) => void }) => (
    <button data-testid="submit-exercise" onClick={() => onSubmit('test answer')}>
      Submit
    </button>
  ),
}))

vi.mock('@/components/exercises/FeedbackPanel', () => ({
  FeedbackPanel: ({ onNext, isLast }: { onNext: () => void; isLast: boolean }) => (
    <button data-testid="next-btn" onClick={onNext}>
      {isLast ? 'Finish session' : 'Next →'}
    </button>
  ),
}))

vi.mock('@/components/exercises/HintPanel', () => ({
  HintPanel: () => null,
}))

vi.mock('@/components/PushPermissionPrompt', () => ({
  PushPermissionPrompt: () => null,
}))

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockConcept: Concept = {
  id: 'concept-1',
  unit_id: 'unit-1',
  type: 'grammar',
  title: 'Test Concept',
  explanation: 'Test explanation',
  examples: [],
  difficulty: 1,
  level: 'B1',
  grammar_focus: 'indicative',
  created_at: '2024-01-01T00:00:00Z',
}

function makeExercise(id: string): Exercise {
  return {
    id,
    concept_id: 'concept-1',
    type: 'gap_fill',
    prompt: 'Fill in the blank: ___',
    expected_answer: 'test',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    created_at: '2024-01-01T00:00:00Z',
  }
}

const mockGradeResult = {
  score: 3,
  is_correct: true,
  feedback: 'Great job!',
  corrected_version: '',
  explanation: 'Well done.',
  next_review_in_days: 7,
}

function makeItem(exerciseId = 'exercise-1'): StudyItem {
  return { concept: mockConcept, exercise: makeExercise(exerciseId) }
}

function makeFetch(opts: { generateFails?: boolean } = {}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url === '/api/submit') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGradeResult) })
    }
    if (url === '/api/sessions/complete') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }
    if (url === '/api/exercises/generate') {
      if (opts.generateFails) {
        return Promise.reject(new Error('Network error'))
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makeExercise(`generated-${Math.random()}`)),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Submit an answer and wait for the feedback panel to appear. */
async function submitAndWaitForFeedback() {
  await userEvent.click(screen.getByTestId('submit-exercise'))
  await waitFor(() => screen.getByTestId('next-btn'), { timeout: 1000 })
}

// ── Setup / teardown ──────────────────────────────────────────────────────────
beforeEach(() => {
  mockRouter = { push: vi.fn(), prefetch: vi.fn() }
  global.fetch = makeFetch()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('StudySession — Perf-A #4 prefetch & auto-generation', () => {
  it('calls router.prefetch("/study") when session reaches done phase', async () => {
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await userEvent.click(screen.getByTestId('next-btn'))
    await waitFor(() => expect(mockRouter.prefetch).toHaveBeenCalledWith('/study'))
  })

  it('calls router.prefetch(returnHref) when returnHref is provided', async () => {
    render(<StudySession items={[makeItem()]} returnHref="/curriculum/concept-1" />)
    await submitAndWaitForFeedback()
    await userEvent.click(screen.getByTestId('next-btn'))
    await waitFor(() =>
      expect(mockRouter.prefetch).toHaveBeenCalledWith('/curriculum/concept-1'),
    )
  })

  it('calls /api/exercises/generate ×3 during feedback on last drill exercise', async () => {
    const generateConfig = {
      conceptId: 'concept-1',
      concept: mockConcept,
      exerciseType: 'gap_fill',
    }
    render(
      <StudySession items={[makeItem()]} practiceMode generateConfig={generateConfig} />,
    )
    await submitAndWaitForFeedback()
    await waitFor(() => {
      const generateCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => call[0] === '/api/exercises/generate',
      )
      expect(generateCalls).toHaveLength(3)
    })
  })

  it('does not trigger auto-generation twice even if effect re-runs', async () => {
    const generateConfig = {
      conceptId: 'concept-1',
      concept: mockConcept,
      exerciseType: 'gap_fill',
    }
    render(
      <StudySession items={[makeItem()]} practiceMode generateConfig={generateConfig} />,
    )
    await submitAndWaitForFeedback()
    // Wait for generation to complete so effect can re-run with new dynamicItems.length
    await waitFor(() => {
      const generateCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => call[0] === '/api/exercises/generate',
      )
      expect(generateCalls).toHaveLength(3)
    })
    // Allow any potential re-trigger to surface
    await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
    const generateCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[0] === '/api/exercises/generate',
    )
    expect(generateCalls).toHaveLength(3)
  })

  it('shows "Generate 3 more" button when auto-generation fails', async () => {
    global.fetch = makeFetch({ generateFails: true })
    const generateConfig = {
      conceptId: 'concept-1',
      concept: mockConcept,
      exerciseType: 'gap_fill',
    }
    render(
      <StudySession items={[makeItem()]} practiceMode generateConfig={generateConfig} />,
    )
    await submitAndWaitForFeedback()
    // Click next to reach done screen (generate failed → no extra items)
    await userEvent.click(screen.getByTestId('next-btn'))
    await waitFor(() => screen.getByText('Generate 3 more'))
  })

  it('does not call /api/exercises/generate in a normal (non-practice) session', async () => {
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
    const generateCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[0] === '/api/exercises/generate',
    )
    expect(generateCalls).toHaveLength(0)
  })
})
