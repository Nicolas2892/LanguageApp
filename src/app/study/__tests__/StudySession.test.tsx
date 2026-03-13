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
  FeedbackPanel: ({ onNext, onTryAgain, isLast, isGenerating }: { onNext: () => void; onTryAgain?: () => void; isLast: boolean; isGenerating?: boolean }) => (
    <div>
      <button data-testid="next-btn" onClick={onNext} disabled={isGenerating}>
        {isGenerating ? 'Generando…' : isLast ? 'Finalizar sesión' : 'Siguiente →'}
      </button>
      {onTryAgain && <button data-testid="try-again-btn" onClick={onTryAgain}>Try again</button>}
    </div>
  ),
}))

vi.mock('@/components/exercises/HintPanel', () => ({
  HintPanel: () => <div data-testid="hint-panel" />,
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
    source: 'seed',
    created_at: '2024-01-01T00:00:00Z',
  }
}

const mockScoreChunk = {
  score: 3,
  is_correct: true,
  next_review_in_days: 7,
  just_mastered: false,
  mastered_concept_title: null,
}
const mockDetailsChunk = {
  feedback: 'Great job!',
  corrected_version: '',
  explanation: 'Well done.',
}
const mockGradeResult = { ...mockScoreChunk, ...mockDetailsChunk }

/** Build a streaming NDJSON Response for /api/submit */
function makeStreamingSubmitResponse(overrides: {
  score?: number; is_correct?: boolean; next_review_in_days?: number
  just_mastered?: boolean; mastered_concept_title?: string | null
  feedback?: string; corrected_version?: string; explanation?: string
} = {}) {
  const combined = { ...mockGradeResult, ...overrides }
  const scoreChunk = {
    score: combined.score,
    is_correct: combined.is_correct,
    next_review_in_days: combined.next_review_in_days,
    just_mastered: combined.just_mastered,
    mastered_concept_title: combined.mastered_concept_title,
  }
  const detailsChunk = {
    feedback: combined.feedback,
    corrected_version: combined.corrected_version,
    explanation: combined.explanation,
  }
  const encoder = new TextEncoder()
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify(scoreChunk) + '\n'))
      controller.enqueue(encoder.encode(JSON.stringify(detailsChunk) + '\n'))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } })
}

function makeItem(exerciseId = 'exercise-1'): StudyItem {
  return { concept: mockConcept, exercise: makeExercise(exerciseId) }
}

function makeFetch(opts: { generateFails?: boolean } = {}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url === '/api/submit') {
      return Promise.resolve(makeStreamingSubmitResponse())
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
    await waitFor(() => screen.getByText('Generar 3 más'))
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

// ── UX-AB: Concept collapse ───────────────────────────────────────────────────
describe('StudySession — UX-AB concept collapse', () => {
  it('shows "Notes ↓" toggle collapsed by default on every exercise', () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    const toggle = screen.getByRole('button', { name: /Notas/i })
    expect(toggle.textContent).toContain('Notas ↓')
    // Collapsed: aria-expanded is false
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('clicking toggle expands explanation and changes label to "Notes ↑"', async () => {
    render(<StudySession items={[makeItem()]} />)
    const toggle = screen.getByRole('button', { name: /Notas/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(toggle)
    expect(screen.getByText('Notas ↑')).toBeTruthy()
  })

  it('collapses again after moving to the next exercise', async () => {
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    // Expand on exercise 1
    await userEvent.click(screen.getByRole('button', { name: /Notas/i }))
    expect(screen.getByText('Notas ↑')).toBeTruthy()
    // Submit and advance
    await submitAndWaitForFeedback()
    await userEvent.click(screen.getByTestId('next-btn'))
    // Exercise 2 should be collapsed again
    await waitFor(() => expect(screen.getByText('Notas ↓')).toBeTruthy())
  })
})

// ── UX-AA: Mastery overlay ────────────────────────────────────────────────────
describe('StudySession — UX-AA mastery overlay', () => {
  it('does not show overlay when just_mastered is false', async () => {
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    expect(screen.queryByText('¡Concepto dominado!')).toBeNull()
  })

  it('shows overlay with concept title when just_mastered is true', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse({ just_mastered: true, mastered_concept_title: 'El Subjuntivo' }))
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await waitFor(() => expect(screen.getByText('¡Concepto dominado!')).toBeTruthy())
    // The mastery overlay contains the concept title in a <span>
    expect(screen.getByText('El Subjuntivo')).toBeTruthy()
  })

  it('"Continue" button closes the overlay', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse({ just_mastered: true, mastered_concept_title: 'Test Concept' }))
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await waitFor(() => screen.getByText('¡Concepto dominado!'))
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => expect(screen.queryByText('¡Concepto dominado!')).toBeNull())
  })

  it('schedules a 4-second auto-dismiss timer when overlay opens', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse({ just_mastered: true, mastered_concept_title: 'El Subjuntivo' }))
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem()]} />)
    await submitAndWaitForFeedback()
    await waitFor(() => screen.getByText('¡Concepto dominado!'))
    // Verify that a 4000ms dismiss timer was scheduled by the useEffect
    const dismissTimers = setTimeoutSpy.mock.calls.filter(([, ms]) => ms === 4000)
    expect(dismissTimers.length).toBeGreaterThan(0)
  })

  it('fires overlay only once per concept even if same concept submits twice', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        callCount++
        return Promise.resolve(makeStreamingSubmitResponse({ just_mastered: true, mastered_concept_title: 'El Subjuntivo' }))
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    render(<StudySession items={[makeItem('e1'), makeItem('e2')]} />)
    // First submission — overlay should show
    await submitAndWaitForFeedback()
    await waitFor(() => screen.getByText('¡Concepto dominado!'))
    // Close it
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }))
    await waitFor(() => expect(screen.queryByText('¡Concepto dominado!')).toBeNull())
    // Move to next exercise (same concept) via next-btn on feedback panel
    const nextBtn = screen.getByTestId('next-btn')
    await userEvent.click(nextBtn)
    // Second submission — should NOT reopen overlay
    await waitFor(() => screen.getByTestId('submit-exercise'))
    await submitAndWaitForFeedback()
    await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
    expect(callCount).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('¡Concepto dominado!')).toBeNull()
  })
})

// ── Fix-I: Drill auto-generation race condition ────────────────────────────────
describe('StudySession — Fix-I drill generation disables Next button', () => {
  const generateConfig = {
    conceptId: 'concept-1',
    concept: mockConcept,
    exerciseType: 'gap_fill' as const,
  }

  it('disables Next button while generation is in-flight', async () => {
    // Never resolve the generate call so generatingMore stays true
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse())
      }
      if (url === '/api/sessions/complete') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }
      if (url === '/api/exercises/generate') {
        return new Promise(() => {}) // never resolves
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    render(
      <StudySession items={[makeItem()]} practiceMode generateConfig={generateConfig} />,
    )
    await submitAndWaitForFeedback()

    // Wait for generation to start (button shows "Generating…" and is disabled)
    await waitFor(() => {
      const btn = screen.getByTestId('next-btn')
      expect(btn).toBeDisabled()
    })
    expect(screen.getByTestId('next-btn').textContent).toBe('Generando…')
  })

  it('re-enables Next button when generation completes successfully', async () => {
    render(
      <StudySession items={[makeItem()]} practiceMode generateConfig={generateConfig} />,
    )
    await submitAndWaitForFeedback()

    // Initially may be disabled (generation in-flight), then re-enables
    await waitFor(() => {
      const btn = screen.getByTestId('next-btn')
      expect(btn).not.toBeDisabled()
    })
  })

  it('re-enables Next button when generation fails', async () => {
    global.fetch = makeFetch({ generateFails: true })

    render(
      <StudySession items={[makeItem()]} practiceMode generateConfig={generateConfig} />,
    )
    await submitAndWaitForFeedback()

    // After failure, generatingMore = false → button re-enabled
    await waitFor(() => {
      const btn = screen.getByTestId('next-btn')
      expect(btn).not.toBeDisabled()
    })
  })
})

// ── UX-W: HintPanel progressive disclosure ────────────────────────────────────
describe('StudySession — UX-W hint panel gating', () => {
  function makeItemWithHint(exerciseId = 'exercise-hint'): StudyItem {
    return {
      concept: mockConcept,
      exercise: { ...makeExercise(exerciseId), hint_1: 'Try using a connector.' },
    }
  }

  it('does not render HintPanel before any wrong attempt', () => {
    render(<StudySession items={[makeItemWithHint()]} />)
    expect(screen.queryByTestId('hint-panel')).toBeNull()
  })

  it('renders HintPanel in answering phase after clicking Try again following a wrong answer', async () => {
    global.fetch = vi.fn().mockResolvedValue(makeStreamingSubmitResponse({ score: 0, is_correct: false }))
    render(<StudySession items={[makeItemWithHint(), makeItemWithHint('e2')]} />)
    expect(screen.queryByTestId('hint-panel')).toBeNull()
    // Submit wrong answer → feedback phase shows Try again button
    await userEvent.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => screen.getByTestId('try-again-btn'))
    // Click Try again → back to answering phase with wrongAttempts=1
    await userEvent.click(screen.getByTestId('try-again-btn'))
    // Now in answering phase with wrongAttempts > 0 → hint-panel shown
    await waitFor(() => expect(screen.getByTestId('hint-panel')).toBeTruthy())
  })

  it('hint panel is hidden again after advancing to next exercise (wrongAttempts resets)', async () => {
    global.fetch = vi.fn().mockResolvedValue(makeStreamingSubmitResponse({ score: 0, is_correct: false }))
    render(<StudySession items={[makeItemWithHint(), makeItemWithHint('e2')]} />)
    await userEvent.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => screen.getByTestId('next-btn'))
    await userEvent.click(screen.getByTestId('next-btn'))
    // Exercise 2: wrongAttempts reset to 0 — hint-panel hidden
    await waitFor(() => expect(screen.queryByTestId('hint-panel')).toBeNull())
  })
})
