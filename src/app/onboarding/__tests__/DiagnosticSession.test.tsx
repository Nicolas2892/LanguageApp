/**
 * Tests for DiagnosticSession component — onboarding diagnostic quiz
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiagnosticSession } from '../DiagnosticSession'
import type { DiagnosticItem } from '../DiagnosticSession'

const mockRouter = { push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }
vi.mock('next/navigation', () => ({ useRouter: () => mockRouter }))

vi.mock('@/components/exercises/ExerciseRenderer', () => ({
  ExerciseRenderer: ({ onSubmit, disabled }: { onSubmit: (answer: string) => void; disabled: boolean }) => (
    <button
      data-testid="submit-exercise"
      disabled={disabled}
      onClick={() => onSubmit('test answer')}
    >
      Submit
    </button>
  ),
}))

vi.mock('@/components/SvgTilde', () => ({
  SvgTilde: () => <div data-testid="svg-tilde" />,
}))

function makeExercise(id: string) {
  return {
    id,
    type: 'gap_fill' as const,
    prompt: 'Fill in: ___',
    expected_answer: 'haya',
    concept_id: `concept-${id}`,
    annotations: null,
    answer_variants: null,
    source: 'seed' as const,
    created_at: '2026-01-01T00:00:00Z',
    hint_1: null,
    hint_2: null,
  }
}

function makeDiagnosticItem(id: string): DiagnosticItem {
  return {
    concept: {
      id: `concept-${id}`,
      title: `Concept ${id}`,
      explanation: `Explanation for concept ${id}`,
      level: 'B2',
      type: 'grammar',
      difficulty: 2,
      grammar_focus: 'subjunctive',
      unit_id: 'unit-1',
      examples: [],
      created_at: '2026-01-01T00:00:00Z',
    },
    exercise: makeExercise(id),
  }
}

function makeStreamingSubmitResponse(overrides: Record<string, unknown> = {}) {
  const scoreChunk = JSON.stringify({ type: 'score', score: 2, is_correct: true, next_review_in_days: 6, just_mastered: false, mastered_concept_title: null, ...overrides })
  const detailsChunk = JSON.stringify({ type: 'details', feedback: 'Good answer.', corrected_version: 'haya', explanation: 'Use subjunctive.', ...overrides })
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(scoreChunk + '\n' + detailsChunk + '\n'))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } })
}

describe('DiagnosticSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse())
      }
      if (url === '/api/onboarding/complete') {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })
  })

  it('renders error message + dashboard link when items=[]', () => {
    render(<DiagnosticSession items={[]} />)
    expect(screen.getByText(/No se encontraron/)).toBeInTheDocument()
    expect(screen.getByText('ve al inicio')).toHaveAttribute('href', '/dashboard')
  })

  it('renders ExerciseRenderer + concept explanation on mount', () => {
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)
    expect(screen.getByTestId('submit-exercise')).toBeInTheDocument()
    expect(screen.getByText('Explanation for concept 1')).toBeInTheDocument()
  })

  it('shows progress bars matching item count', () => {
    const items = [makeDiagnosticItem('1'), makeDiagnosticItem('2'), makeDiagnosticItem('3')]
    const { container } = render(<DiagnosticSession items={items} />)
    const bars = container.querySelectorAll('.h-1.flex-1.rounded-full')
    expect(bars).toHaveLength(3)
  })

  it('shows "Evaluando…" while submitting', async () => {
    // Make fetch hang
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    expect(screen.getByText('Evaluando…')).toBeInTheDocument()
  })

  it('transitions to feedback showing score label + feedback text', async () => {
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Bien')).toBeInTheDocument()
    })
    expect(screen.getByText('Good answer.')).toBeInTheDocument()
  })

  it('shows corrected_version when answer is incorrect', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse({ score: 0, is_correct: false }))
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Correcto:')).toBeInTheDocument()
    })
  })

  it('hides corrected_version when answer is correct', async () => {
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Bien')).toBeInTheDocument()
    })
    expect(screen.queryByText('Correcto:')).not.toBeInTheDocument()
  })

  it('"Siguiente →" advances to next exercise', async () => {
    const user = userEvent.setup()
    const items = [makeDiagnosticItem('1'), makeDiagnosticItem('2')]
    render(<DiagnosticSession items={items} />)

    // Submit first exercise
    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Siguiente →')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Siguiente →'))
    // Should show second concept's explanation
    expect(screen.getByText('Explanation for concept 2')).toBeInTheDocument()
  })

  it('last item button says "Finalizar diagnóstico"', async () => {
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Finalizar diagnóstico')).toBeInTheDocument()
    })
  })

  it('completion calls /api/onboarding/complete + router.push', async () => {
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Finalizar diagnóstico')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Finalizar diagnóstico'))
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/complete', expect.any(Object))
  })

  it('completion failure reverts to answering with error', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/submit') {
        return Promise.resolve(makeStreamingSubmitResponse())
      }
      if (url === '/api/onboarding/complete') {
        return Promise.resolve(new Response('{}', { status: 500 }))
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText('Finalizar diagnóstico')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Finalizar diagnóstico'))
    await waitFor(() => {
      expect(screen.getByText(/No se pudo completar/)).toBeInTheDocument()
    })
    // Should show ExerciseRenderer again
    expect(screen.getByTestId('submit-exercise')).toBeInTheDocument()
  })

  it('submit failure shows "Algo salió mal" error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<DiagnosticSession items={[makeDiagnosticItem('1')]} />)

    await user.click(screen.getByTestId('submit-exercise'))
    await waitFor(() => {
      expect(screen.getByText(/Algo salió mal/)).toBeInTheDocument()
    })
  })
})
