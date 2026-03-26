import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VocabSession } from '../VocabSession'
import type { VocabSessionItem } from '@/lib/vocab/types'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}))

// Mock haptics
vi.mock('@/lib/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerSuccess: vi.fn(),
    triggerError: vi.fn(),
    triggerWarning: vi.fn(),
  }),
}))

// Mock auto-focus helper
vi.mock('@/lib/hooks/useAutoFocus', () => ({
  focusWithoutScroll: vi.fn(),
}))

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackVocabDrillStarted: vi.fn(),
  trackVocabDrillCompleted: vi.fn(),
  trackFeatureFirstUse: vi.fn(),
}))

const mockItems: VocabSessionItem[] = [
  {
    vocabId: '11111111-1111-1111-1111-111111111111',
    expression: 'sin embargo',
    category: 'discourse_markers',
    sentence: 'Quería ir al cine; _____, llovía demasiado.',
    correctForm: 'sin embargo',
    answerVariants: null,
    english: 'I wanted to go to the cinema; however, it was raining too much.',
    hint: 'however',
  },
  {
    vocabId: '22222222-2222-2222-2222-222222222222',
    expression: 'dar a conocer',
    category: 'fixed_phrases',
    sentence: 'La empresa decidió _____ su nuevo producto en la feria.',
    correctForm: 'dar a conocer',
    answerVariants: null,
    english: 'The company decided to unveil its new product at the fair.',
    hint: 'to make known',
  },
  {
    vocabId: '33333333-3333-3333-3333-333333333333',
    expression: 'en definitiva',
    category: 'discourse_markers',
    sentence: '_____, lo más importante es la salud.',
    correctForm: 'en definitiva',
    answerVariants: ['En definitiva'],
    english: 'Ultimately, the most important thing is health.',
    hint: 'ultimately',
  },
]

describe('VocabSession', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 1. Renders first exercise with sentence blank and category eyebrow ────

  it('renders first exercise sentence with blank', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.getByText(/Quería ir al cine;/)).toBeInTheDocument()
    expect(screen.getByText(/, llovía demasiado\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Comprobar/ })).toBeInTheDocument()
  })

  it('renders Vocabulario eyebrow label', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.getByText('Vocabulario')).toBeInTheDocument()
  })

  it('renders category label in eyebrow', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.getByText('Marcadores del Discurso')).toBeInTheDocument()
  })

  it('renders English translation', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(
      screen.getByText('I wanted to go to the cinema; however, it was raining too much.'),
    ).toBeInTheDocument()
  })

  it('renders progress counter', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('disables Comprobar button when input is empty', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.getByRole('button', { name: /Comprobar/ })).toBeDisabled()
  })

  // ── 2. Shows hint when showHint=true ──────────────────────────────────────

  it('shows hint when showHint is true', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={true}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.getByText('[however]')).toBeInTheDocument()
  })

  it('does not show hint when showHint is false', () => {
    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )
    expect(screen.queryByText('[however]')).not.toBeInTheDocument()
  })

  // ── 3. Correct answer triggers green flash and auto-advances ──────────────

  it('shows inline success display on correct answer', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'sin embargo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // Input is hidden, correct form shown inline with checkmark
    expect(screen.queryByPlaceholderText(/Escribe la expresión/)).not.toBeInTheDocument()
    expect(screen.getByText('sin embargo')).toBeInTheDocument()
    // Comprobar button is hidden
    expect(screen.queryByRole('button', { name: /Comprobar/ })).not.toBeInTheDocument()
  })

  it('auto-advances to next item after correct answer', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'sin embargo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // Wait for auto-advance (1500ms timer in component)
    await waitFor(
      () => {
        expect(screen.getByText(/La empresa decidió/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('fires grade API on correct answer', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'sin embargo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/vocab/grade',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  // ── 4. Incorrect answer shows feedback panel with try again button ────────

  it('shows incorrect feedback with try again button', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'por lo tanto')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(screen.getByText('Incorrecto')).toBeInTheDocument()
    expect(screen.getByTestId('try-again-btn')).toBeInTheDocument()
    // Input is swapped out
    expect(screen.queryByPlaceholderText(/Escribe la expresión/)).not.toBeInTheDocument()
  })

  it('Try Again clears input and returns to answering phase', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'por lo tanto')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByTestId('try-again-btn'))

    expect(screen.getByPlaceholderText(/Escribe la expresión/)).toHaveValue('')
    expect(screen.getByRole('button', { name: /Comprobar/ })).toBeInTheDocument()
  })

  it('shows Siguiente button on incorrect answer for non-last item', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'wrong')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeInTheDocument()
  })

  // ── 5. Accent error shows orange flash and feedback ───────────────────────

  it('shows accent_error feedback and hides input', async () => {
    const user = userEvent.setup()

    // Use the third item which has 'en definitiva' as correctForm
    // Type without accent won't trigger accent_error since 'en definitiva' has no accents.
    // Instead, create items with accented correctForm.
    const accentItems: VocabSessionItem[] = [
      {
        vocabId: '44444444-4444-4444-4444-444444444444',
        expression: 'además',
        category: 'discourse_markers',
        sentence: '_____, hay que considerar otros factores.',
        correctForm: 'además',
        answerVariants: null,
        english: 'Moreover, we must consider other factors.',
        hint: 'moreover',
      },
    ]

    render(
      <VocabSession
        items={accentItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    // Type without accent: 'ademas' instead of 'además'
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'ademas')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    expect(screen.getByText(/Casi — revisa los acentos/)).toBeInTheDocument()
    // Input is swapped out
    expect(screen.queryByPlaceholderText(/Escribe la expresión/)).not.toBeInTheDocument()
  })

  it('accent_error shows Siguiente button but no Try Again button', async () => {
    const user = userEvent.setup()

    const accentItems: VocabSessionItem[] = [
      {
        vocabId: '44444444-4444-4444-4444-444444444444',
        expression: 'además',
        category: 'discourse_markers',
        sentence: '_____, hay que considerar otros factores.',
        correctForm: 'además',
        answerVariants: null,
        english: 'Moreover, we must consider other factors.',
        hint: 'moreover',
      },
    ]

    render(
      <VocabSession
        items={accentItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'ademas')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // accent_error shows Next but NOT try again (only incorrect gets try again)
    expect(screen.getByRole('button', { name: /Siguiente|Finalizar/ })).toBeInTheDocument()
    expect(screen.queryByTestId('try-again-btn')).not.toBeInTheDocument()
  })

  // ── 6. Done screen shows summary with per-category breakdown ──────────────

  it('shows done screen after last item incorrect answer and Finalizar clicked', async () => {
    const user = userEvent.setup()

    const singleItem: VocabSessionItem[] = [mockItems[0]]

    render(
      <VocabSession
        items={singleItem}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'wrong answer')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByRole('button', { name: /Finalizar sesión/ }))

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Practica de nuevo/ })).toBeInTheDocument()
  })

  it('shows done screen with correct percentage after mixed session', async () => {
    const user = userEvent.setup()

    // Use 2 items: first wrong (manual next), second wrong (finalizar)
    // This tests the summary percentage without needing auto-advance
    const twoItems: VocabSessionItem[] = [mockItems[0], mockItems[1]]

    render(
      <VocabSession
        items={twoItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    // First item: wrong answer, click Siguiente to advance
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'wrong')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))

    // Second item: correct answer — triggers done via auto-advance
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'dar a conocer')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // Wait for auto-advance to done screen
    await waitFor(
      () => {
        expect(screen.getByText('50%')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('shows per-category breakdown on done screen', async () => {
    const user = userEvent.setup()

    const twoItems: VocabSessionItem[] = [mockItems[0], mockItems[1]]

    render(
      <VocabSession
        items={twoItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    // First item (discourse_markers): wrong, advance manually
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'wrong')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))

    // Second item (fixed_phrases): wrong, finalizar
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'wrong')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByRole('button', { name: /Finalizar sesión/ }))

    // Category breakdown section
    expect(screen.getByText('Por categoría')).toBeInTheDocument()
    expect(screen.getByText('Marcadores del Discurso')).toBeInTheDocument()
    expect(screen.getByText('Expresiones Fijas')).toBeInTheDocument()
  })

  // ── 7. Exit dialog shows when X is clicked ────────────────────────────────

  it('shows exit confirmation dialog when X is clicked', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.click(screen.getByRole('button', { name: /Salir de la sesión/ }))

    expect(screen.getByText('¿Salir de la Sesión?')).toBeInTheDocument()
    expect(
      screen.getByText('Tu progreso parcial se ha guardado.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Seguir/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salir/ })).toBeInTheDocument()
  })

  it('dismisses exit dialog when Seguir is clicked', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    await user.click(screen.getByRole('button', { name: /Salir de la sesión/ }))
    await user.click(screen.getByRole('button', { name: /Seguir/ }))

    // Dialog dismissed, exercise still visible
    expect(screen.queryByText('¿Salir de la Sesión?')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Escribe la expresión/)).toBeInTheDocument()
  })

  // ── Additional edge cases ─────────────────────────────────────────────────

  it('does not show hint when hint is null even with showHint=true', () => {
    const noHintItems: VocabSessionItem[] = [
      {
        ...mockItems[0],
        hint: null,
      },
    ]

    render(
      <VocabSession
        items={noHintItems}
        showHint={true}
        sessionUrl="/vocab/session?test"
      />,
    )

    // No hint bracket should appear
    expect(screen.queryByText(/^\[/)).not.toBeInTheDocument()
  })

  it('does not fire grade API twice for same item on retry', async () => {
    const user = userEvent.setup()

    const singleItem: VocabSessionItem[] = [mockItems[0]]

    render(
      <VocabSession
        items={singleItem}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    // First attempt: wrong
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'wrong')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // Try again
    await user.click(screen.getByTestId('try-again-btn'))

    // Second attempt: correct
    await user.type(screen.getByPlaceholderText(/Escribe la expresión/), 'sin embargo')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))

    // Only one fetch call for this item (attemptRecordedRef prevents duplicates)
    const gradeCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c: unknown[]) => c[0] === '/api/vocab/grade',
    )
    expect(gradeCalls).toHaveLength(1)
  })

  it('submits answer on Enter key press', async () => {
    const user = userEvent.setup()

    render(
      <VocabSession
        items={mockItems}
        showHint={false}
        sessionUrl="/vocab/session?test"
      />,
    )

    const input = screen.getByPlaceholderText(/Escribe la expresión/)
    await user.type(input, 'sin embargo')
    await user.keyboard('{Enter}')

    // Should have submitted — input gone, correct form shown
    expect(screen.queryByPlaceholderText(/Escribe la expresión/)).not.toBeInTheDocument()
    expect(screen.getByText('sin embargo')).toBeInTheDocument()
  })
})
