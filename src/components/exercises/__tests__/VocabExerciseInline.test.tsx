import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VocabExerciseInline } from '../VocabExerciseInline'
import type { VocabInlineItem } from '../VocabExerciseInline'

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, supported: true }),
}))

vi.mock('@/components/SpeakButton', () => ({
  SpeakButton: () => <button data-testid="speak-btn">Speak</button>,
}))

const makeItem = (overrides: Partial<VocabInlineItem> = {}): VocabInlineItem => ({
  vocabId: 'voc1',
  expression: 'sin embargo',
  category: 'discourse_markers',
  sentence: '_____, no estoy de acuerdo con esa idea.',
  correctForm: 'Sin embargo',
  answerVariants: ['sin embargo'],
  english: 'However, I don\'t agree with that idea.',
  hint: 'however',
  ...overrides,
})

describe('VocabExerciseInline', () => {
  const onGraded = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sentence with blank', () => {
    render(<VocabExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.getByText(/no estoy de acuerdo/)).toBeInTheDocument()
  })

  it('renders category in eyebrow', () => {
    render(<VocabExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.getByText('Marcadores del Discurso')).toBeInTheDocument()
  })

  it('shows hint when showHint is true', () => {
    render(<VocabExerciseInline item={makeItem()} showHint={true} onGraded={onGraded} />)
    expect(screen.getByText('[however]')).toBeInTheDocument()
  })

  it('calls onGraded with correct on right answer', async () => {
    const user = userEvent.setup()
    render(<VocabExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Expresión'), 'sin embargo')
    await user.click(screen.getByRole('button'))
    expect(onGraded).toHaveBeenCalledWith('correct')
  })

  it('calls onGraded with incorrect on wrong answer', async () => {
    const user = userEvent.setup()
    render(<VocabExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Expresión'), 'no obstante')
    await user.click(screen.getByRole('button'))
    expect(onGraded).toHaveBeenCalledWith('incorrect')
  })

  it('shows English translation', () => {
    render(<VocabExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    expect(screen.getByText(/However, I don't agree/)).toBeInTheDocument()
  })

  it('shows SpeakButton after grading', async () => {
    const user = userEvent.setup()
    render(<VocabExerciseInline item={makeItem()} showHint={false} onGraded={onGraded} />)
    await user.type(screen.getByPlaceholderText('Expresión'), 'sin embargo')
    await user.click(screen.getByRole('button'))
    expect(screen.getByTestId('speak-btn')).toBeInTheDocument()
  })
})
