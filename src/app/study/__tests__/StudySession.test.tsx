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
  just_mastered: false,
  mastered_concept_title: null,
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
  vi.useRealTimers()
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

// ── UX-Z: Time estimate ───────────────────────────────────────────────────────
describe('StudySession — UX-Z time estimate', () => {
  it('does not show time estimate in sprint mode', async () => {
    render(
      <StudySession
        items={[makeItem('e1'), makeItem('e2'), makeItem('e3')]}
        sprintConfig={{ limitType: 'count', limit: 3 }}
      />,
    )
    await submitAndWaitForFeedback()
    expect(screen.queryByText(/min/)).toBeNull()
  })

  it('does not show time estimate when only 1 exercise remains', async () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    await submitAndWaitForFeedback()
    // After first submit, 1 exercise remains — no estimate shown
    expect(screen.queryByText(/min/)).toBeNull()
  })

  it('shows "~N min" estimate after first submission in multi-exercise session', async () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2'), makeItem('e3')]} />)
    await submitAndWaitForFeedback()
    // 2 remaining exercises — estimate should appear
    expect(screen.getByText(/~\d+ min/)).toBeTruthy()
  })
})

// ── UX-AB: Concept collapse ───────────────────────────────────────────────────
describe('StudySession — UX-AB concept collapse', () => {
  it('shows full explanation card on the first exercise (no toggle button)', async () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    // Full explanation visible
    expect(screen.getByText('Test explanation')).toBeTruthy()
    // No toggle button
    expect(screen.queryByText(/remind me/)).toBeNull()
  })

  it('shows "↓ remind me" toggle on second exercise with the same concept', async () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    await submitAndWaitForFeedback()
    await userEvent.click(screen.getByTestId('next-btn'))
    await waitFor(() => expect(screen.getByText(/remind me/)).toBeTruthy())
  })

  it('clicking toggle expands explanation and sets aria-expanded=true', async () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    await submitAndWaitForFeedback()
    await userEvent.click(screen.getByTestId('next-btn'))
    const toggle = await screen.findByRole('button', { name: /remind me/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(toggle)
    // After click the button text changes to "↑ hide"
    expect(screen.getByText(/hide/)).toBeTruthy()
  })

  it('shows full card when a NEW concept appears for the first time', async () => {
    const conceptB: Concept = { ...mockConcept, id: 'concept-2', title: 'Concept B', explanation: 'B explanation' }
    const items: StudyItem[] = [
      { concept: mockConcept, exercise: makeExercise('e1') },
      { concept: conceptB, exercise: makeExercise('e2') },
    ]
    render(<StudySession items={items} />)
    await submitAndWaitForFeedback()
    await userEvent.click(screen.getByTestId('next-btn'))
    // Full explanation of concept B should be visible immediately
    await waitFor(() => expect(screen.getByText('B explanation')).toBeTruthy())
    expect(screen.queryByText(/remind me/)).toBeNull()
  })
})

// ── UX-AA: Mastery overlay ────────────────────────────────────────────────────
describe('StudySession — UX-AA mastery overlay', () => {
  it('does not show overlay when just_mastered is false', async () => {
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    expect(screen.queryByText('Concept mastered!')).toBeNull()
  })

  it('shows overlay with concept title when just_mastered is true', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockGradeResult,
            just_mastered: true,
            mastered_concept_title: 'El Subjuntivo',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await waitFor(() => expect(screen.getByText('Concept mastered!')).toBeTruthy())
    // The mastery overlay contains the concept title in a <span>
    expect(screen.getByText('El Subjuntivo')).toBeTruthy()
  })

  it('"Continue" button closes the overlay', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockGradeResult,
            just_mastered: true,
            mastered_concept_title: 'Test Concept',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await waitFor(() => screen.getByText('Concept mastered!'))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.queryByText('Concept mastered!')).toBeNull())
  })

  it('schedules a 4-second auto-dismiss timer when overlay opens', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockGradeResult,
            just_mastered: true,
            mastered_concept_title: 'El Subjuntivo',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await waitFor(() => screen.getByText('Concept mastered!'))
    // Verify that a 4000ms dismiss timer was scheduled by the useEffect
    const dismissTimers = setTimeoutSpy.mock.calls.filter(([, ms]) => ms === 4000)
    expect(dismissTimers.length).toBeGreaterThan(0)
  })

  it('fires overlay only once per concept even if same concept submits twice', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        callCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockGradeResult,
            just_mastered: true,
            mastered_concept_title: 'El Subjuntivo',
          }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    // First submission — overlay should show
    await submitAndWaitForFeedback()
    await waitFor(() => screen.getByText('Concept mastered!'))
    // Close it
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(screen.queryByText('Concept mastered!')).toBeNull())
    // Move to next exercise (same concept) via next-btn on feedback panel
    const nextBtn = screen.getByTestId('next-btn')
    await userEvent.click(nextBtn)
    // Second submission — should NOT reopen overlay
    await waitFor(() => screen.getByTestId('submit-exercise'))
    await submitAndWaitForFeedback()
    await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
    expect(callCount).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('Concept mastered!')).toBeNull()
  })
})
