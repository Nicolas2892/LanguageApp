import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PronunciationFeedbackPanel } from '../PronunciationFeedbackPanel'
import type { PronunciationResult } from '@/lib/azure/client'

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, supported: true }),
}))

vi.mock('../WordScoreChips', () => ({
  WordScoreChips: ({ words }: { words: unknown[] }) => (
    <div data-testid="word-chips">{words.length} words</div>
  ),
}))

function makeResult(overrides: Partial<PronunciationResult> = {}): PronunciationResult {
  return {
    overallScore: 75,
    fluencyScore: 70,
    prosodyScore: 80,
    words: [{ word: 'hola', accuracyScore: 85, phonemes: [] }],
    ...overrides,
  }
}

describe('PronunciationFeedbackPanel', () => {
  const defaultProps = {
    result: makeResult(),
    sentence: 'Hola, ¿cómo estás?',
    l1Language: null as string | null,
    userAudioUrl: null as string | null,
    onRetry: vi.fn(),
    onNext: vi.fn(),
    isLast: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders word score chips', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} />)
    expect(screen.getByTestId('word-chips')).toBeInTheDocument()
  })

  it('renders three score bars', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} />)
    expect(screen.getByText('Precisión')).toBeInTheDocument()
    expect(screen.getByText('Fluidez')).toBeInTheDocument()
    expect(screen.getByText('Prosodia')).toBeInTheDocument()
  })

  it('renders score percentages', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} result={makeResult({ overallScore: 85, fluencyScore: 72, prosodyScore: 91 })} />)
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('91%')).toBeInTheDocument()
  })

  it('shows L1 tip when l1Language set and word score < 70', () => {
    const result = makeResult({
      words: [{ word: 'perro', accuracyScore: 40, phonemes: [{ phoneme: 'r', score: 30 }] }],
    })
    render(<PronunciationFeedbackPanel {...defaultProps} result={result} l1Language="german" />)
    expect(screen.getByText(/uvular R/)).toBeInTheDocument()
  })

  it('does not show L1 tip when l1Language is null', () => {
    const result = makeResult({
      words: [{ word: 'perro', accuracyScore: 40, phonemes: [{ phoneme: 'r', score: 30 }] }],
    })
    render(<PronunciationFeedbackPanel {...defaultProps} result={result} l1Language={null} />)
    expect(screen.queryByText(/uvular/)).not.toBeInTheDocument()
  })

  it('does not show L1 tip when worst word score >= 70', () => {
    const result = makeResult({
      words: [{ word: 'hola', accuracyScore: 85, phonemes: [] }],
    })
    render(<PronunciationFeedbackPanel {...defaultProps} result={result} l1Language="german" />)
    expect(screen.queryByText(/uvular/)).not.toBeInTheDocument()
  })

  it('shows Nativo audio button', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} />)
    expect(screen.getByText('Nativo')).toBeInTheDocument()
  })

  it('shows Tú audio button when userAudioUrl provided', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} userAudioUrl="blob:test" />)
    expect(screen.getByText('Tú')).toBeInTheDocument()
  })

  it('hides Tú audio button when no userAudioUrl', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} userAudioUrl={null} />)
    expect(screen.queryByText('Tú')).not.toBeInTheDocument()
  })

  it('calls onRetry when Repetir clicked', async () => {
    const user = userEvent.setup()
    render(<PronunciationFeedbackPanel {...defaultProps} />)
    await user.click(screen.getByText('Repetir'))
    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when Siguiente clicked', async () => {
    const user = userEvent.setup()
    render(<PronunciationFeedbackPanel {...defaultProps} />)
    await user.click(screen.getByText('Siguiente →'))
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1)
  })

  it('shows Finalizar instead of Siguiente on last item', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} isLast={true} />)
    expect(screen.getByText('Finalizar')).toBeInTheDocument()
    expect(screen.queryByText('Siguiente →')).not.toBeInTheDocument()
  })

  it('renders Nativo button even without nativeAudioUrl', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} />)
    expect(screen.getByText('Nativo')).toBeInTheDocument()
  })

  it('renders Nativo button with nativeAudioUrl', () => {
    render(<PronunciationFeedbackPanel {...defaultProps} nativeAudioUrl="blob:native-tts" />)
    expect(screen.getByText('Nativo')).toBeInTheDocument()
  })
})
