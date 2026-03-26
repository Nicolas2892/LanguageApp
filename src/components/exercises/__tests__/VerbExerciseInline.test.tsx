import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbExerciseInline } from '../VerbExerciseInline'
import type { VerbInlineItem } from '../VerbExerciseInline'

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, supported: true }),
}))

vi.mock('@/components/SpeakButton', () => ({
  SpeakButton: () => <button data-testid="speak-btn">Speak</button>,
}))

const makeItem = (overrides: Partial<VerbInlineItem> = {}): VerbInlineItem => ({
  verbId: 'v1',
  infinitive: 'comprar',
  tense: 'present_indicative',
  pronoun: 'yo',
  sentence: 'Yo _____ frutas en el mercado.',
  correctForm: 'compro',
  tenseRule: 'Regular -ar present: -o, -as, -a, -amos, -áis, -an',
  english: 'I buy fruit at the market.',
  ...overrides,
})

describe('VerbExerciseInline', () => {
  const onGraded = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sentence with blank', () => {
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.getByText(/Yo/)).toBeInTheDocument()
    expect(screen.getByText(/frutas en el mercado/)).toBeInTheDocument()
  })

  it('renders tense and pronoun in eyebrow', () => {
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.getByText(/Presente.*yo/)).toBeInTheDocument()
  })

  it('shows hint when showHint is true', () => {
    render(<VerbExerciseInline item={makeItem()} showHint={true} onGraded={onGraded} />)
    expect(screen.getByText('[comprar]')).toBeInTheDocument()
  })

  it('hides hint when showHint is false', () => {
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.queryByText('[comprar]')).not.toBeInTheDocument()
  })

  it('disables check button when input empty', () => {
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('calls onGraded with correct on right answer', async () => {
    const user = userEvent.setup()
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Conjugación'), 'compro')
    await user.click(screen.getByRole('button'))
    expect(onGraded).toHaveBeenCalledWith('correct')
  })

  it('calls onGraded with incorrect on wrong answer', async () => {
    const user = userEvent.setup()
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Conjugación'), 'compras')
    await user.click(screen.getByRole('button'))
    expect(onGraded).toHaveBeenCalledWith('incorrect')
  })

  it('shows correct form on incorrect answer', async () => {
    const user = userEvent.setup()
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Conjugación'), 'compras')
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('compro')).toBeInTheDocument()
  })

  it('shows English translation when available', () => {
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.getByText('I buy fruit at the market.')).toBeInTheDocument()
  })

  it('shows SpeakButton after grading', async () => {
    const user = userEvent.setup()
    render(<VerbExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Conjugación'), 'compro')
    await user.click(screen.getByRole('button'))
    expect(screen.getByTestId('speak-btn')).toBeInTheDocument()
  })
})
