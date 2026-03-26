import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnifiedStudySession } from '../UnifiedStudySession'
import type { UnifiedStudyItem } from '../types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/hooks/useHaptics', () => ({
  useHaptics: () => ({ triggerSuccess: vi.fn(), triggerError: vi.fn(), triggerWarning: vi.fn() }),
}))

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, supported: true }),
}))

vi.mock('@/lib/platform/network', () => ({
  isOnline: () => true,
}))

vi.mock('@/lib/fireAndForget', () => ({
  fireAndForget: vi.fn(),
}))

const mockFetch = vi.fn().mockResolvedValue(new Response('{}'))
vi.stubGlobal('fetch', mockFetch)

vi.mock('@/components/exercises/ExerciseRenderer', () => ({
  ExerciseRenderer: ({ onSubmit }: { onSubmit: (answer: string) => void }) => (
    <div data-testid="exercise-renderer">
      <button onClick={() => onSubmit('test answer')}>Submit Grammar</button>
    </div>
  ),
}))

vi.mock('@/components/exercises/FeedbackPanel', () => ({
  FeedbackPanel: ({ onNext, isLast }: { onNext: () => void; isLast: boolean }) => (
    <div data-testid="feedback-panel">
      <button onClick={onNext}>{isLast ? 'Finalizar' : 'Siguiente'}</button>
    </div>
  ),
}))

vi.mock('@/components/SpeakButton', () => ({
  SpeakButton: () => <button data-testid="speak-btn">Speak</button>,
}))

vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))

const makeConceptItem = (): UnifiedStudyItem => ({
  type: 'concept',
  concept: {
    id: 'c1', unit_id: 'u1', type: 'grammar', title: 'Presente Indicativo',
    explanation: 'test', examples: [], difficulty: 1, level: 'B1',
    grammar_focus: null, created_at: '2026-01-01',
  },
  exercise: {
    id: 'e1', concept_id: 'c1', type: 'gap_fill', prompt: 'Yo _____ (comprar) frutas.',
    expected_answer: 'compro', answer_variants: null, hint_1: null, hint_2: null,
    annotations: null, source: 'seed', created_at: '2026-01-01',
  },
})

const makeVerbItem = (): UnifiedStudyItem => ({
  type: 'verb',
  verb: {
    id: 'v1', infinitive: 'comprar', english: 'to buy', frequency_rank: 1,
    verb_group: 'regular', created_at: '2026-01-01',
  },
  sentence: {
    id: 's1', verb_id: 'v1', tense: 'present_indicative', pronoun: 'yo',
    sentence: 'Yo _____ frutas.', correct_form: 'compro',
    tense_rule: 'Regular -ar', english: 'I buy fruit.', created_at: '2026-01-01',
  },
  verbId: 'v1',
  tense: 'present_indicative',
})

const makeVocabItem = (): UnifiedStudyItem => ({
  type: 'vocab',
  vocabItem: {
    id: 'voc1', expression: 'sin embargo', english: 'however',
    category: 'discourse_markers', level: 'B2', frequency_rank: 1, created_at: '2026-01-01',
  },
  sentence: {
    id: 'vs1', vocab_id: 'voc1', sentence: '_____, no estoy de acuerdo.',
    correct_form: 'Sin embargo', answer_variants: ['sin embargo'],
    english: 'However, I disagree.', hint: 'however', created_at: '2026-01-01',
  },
  vocabId: 'voc1',
})

describe('UnifiedStudySession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders grammar item with ExerciseRenderer', () => {
    render(<UnifiedStudySession items={[makeConceptItem()]} />)
    expect(screen.getByTestId('exercise-renderer')).toBeInTheDocument()
    expect(screen.getByText(/Presente Indicativo/)).toBeInTheDocument()
  })

  it('renders verb item with inline verb exercise', () => {
    render(<UnifiedStudySession items={[makeVerbItem()]} />)
    expect(screen.getByText(/comprar/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Conjugación')).toBeInTheDocument()
  })

  it('renders vocab item with inline vocab exercise', () => {
    render(<UnifiedStudySession items={[makeVocabItem()]} />)
    expect(screen.getByText(/no estoy de acuerdo/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Expresión')).toBeInTheDocument()
  })

  it('shows progress bar', () => {
    render(<UnifiedStudySession items={[makeConceptItem(), makeVerbItem()]} />)
    expect(screen.getByText('1/2 · Presente Indicativo')).toBeInTheDocument()
  })

  it('shows exit button', () => {
    render(<UnifiedStudySession items={[makeConceptItem()]} />)
    expect(screen.getByLabelText('Salir')).toBeInTheDocument()
  })

  it('shows done screen after completing all items', async () => {
    const user = userEvent.setup()
    render(<UnifiedStudySession items={[makeVerbItem()]} />)

    // Type correct answer and check
    await user.type(screen.getByPlaceholderText('Conjugación'), 'compro')
    // Find the check button (the round one with Check icon)
    const buttons = screen.getAllByRole('button')
    const checkBtn = buttons.find(b => !b.hasAttribute('disabled') && b.className.includes('bg-primary'))
    if (checkBtn) await user.click(checkBtn)

    // Should show local feedback phase with next/finalize button
    const finalizeBtn = screen.getByText('Finalizar')
    await user.click(finalizeBtn)

    expect(screen.getByText('Sesión Completada')).toBeInTheDocument()
  })

  it('mixes content types in eyebrow labels', () => {
    const items = [makeConceptItem(), makeVerbItem(), makeVocabItem()]
    render(<UnifiedStudySession items={items} />)
    expect(screen.getByText(/Presente Indicativo/)).toBeInTheDocument()
  })
})
