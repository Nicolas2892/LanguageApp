import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PronunciationSession } from '../PronunciationSession'
import type { PronunciationResult } from '@/lib/azure/client'

// ── Mocks ──

const mockStartRecording = vi.fn()
const mockStop = vi.fn()
const mockReset = vi.fn()

let hookState: {
  supported: boolean
  state: 'idle' | 'recording' | 'processing'
  result: PronunciationResult | null
  userAudioUrl: string | null
  error: string | null
  permissionState: string
}

vi.mock('@/lib/hooks/usePronunciationRecording', () => ({
  usePronunciationRecording: () => ({
    ...hookState,
    startRecording: mockStartRecording,
    stop: mockStop,
    reset: mockReset,
  }),
}))

vi.mock('@/lib/fireAndForget', () => ({
  fireAndForget: vi.fn(),
}))

vi.mock('@/lib/platform/network', () => ({
  isOnline: () => true,
}))

// Mock global.fetch to avoid ERR_INVALID_URL on relative URLs in jsdom
const mockFetch = vi.fn().mockResolvedValue(new Response('{}'))
vi.stubGlobal('fetch', mockFetch)

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, supported: true }),
}))

vi.mock('@/components/SpeakButton', () => ({
  SpeakButton: () => <button data-testid="speak-btn">Speak</button>,
}))

vi.mock('@/components/pronunciation/PronunciationFeedbackPanel', () => ({
  PronunciationFeedbackPanel: ({
    onRetry,
    onNext,
    isLast,
  }: {
    onRetry: () => void
    onNext: () => void
    isLast: boolean
  }) => (
    <div data-testid="feedback-panel">
      <button onClick={onRetry}>Repetir</button>
      <button onClick={onNext}>{isLast ? 'Finalizar' : 'Siguiente'}</button>
    </div>
  ),
}))

vi.mock('@/components/pronunciation/PronunciationSummary', () => ({
  PronunciationSummary: ({ results }: { results: PronunciationResult[] }) => (
    <div data-testid="summary">{results.length} results</div>
  ),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode; href: string; [k: string]: unknown }) => {
    const { children, href, ...rest } = props
    return <a href={href} {...rest}>{children}</a>
  },
}))

function makeItem(id: string, text: string) {
  return { id, displayText: text, source: 'verb' as const }
}

function makeResult(overrides: Partial<PronunciationResult> = {}): PronunciationResult {
  return {
    overallScore: 75,
    fluencyScore: 70,
    prosodyScore: 80,
    words: [{ word: 'hola', accuracyScore: 85, phonemes: [] }],
    ...overrides,
  }
}

const defaultItems = [
  makeItem('1', 'Hola, ¿cómo estás?'),
  makeItem('2', 'Buenos días, señor.'),
]

describe('PronunciationSession', () => {
  beforeEach(() => {
    hookState = {
      supported: true,
      state: 'idle',
      result: null,
      userAudioUrl: null,
      error: null,
      permissionState: 'unknown',
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders first sentence and Grabar button', () => {
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByText('Hola, ¿cómo estás?')).toBeInTheDocument()
    expect(screen.getByText('Grabar')).toBeInTheDocument()
  })

  it('shows progress counter', () => {
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByText('Pronunciación · 1/2')).toBeInTheDocument()
  })

  it('disables Grabar when recording not supported', () => {
    hookState.supported = false
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByText('Grabar')).toBeDisabled()
  })

  it('calls startRecording when Grabar clicked', async () => {
    const user = userEvent.setup()
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    await user.click(screen.getByText('Grabar'))
    expect(mockStartRecording).toHaveBeenCalledWith('Hola, ¿cómo estás?')
  })

  it('shows stop button during recording phase', async () => {
    const user = userEvent.setup()
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    await user.click(screen.getByText('Grabar'))
    expect(screen.getByText('Detener Grabación')).toBeInTheDocument()
  })

  it('calls stop when Detener clicked', async () => {
    const user = userEvent.setup()
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    await user.click(screen.getByText('Grabar'))
    await user.click(screen.getByText('Detener Grabación'))
    expect(mockStop).toHaveBeenCalled()
  })

  it('shows spinner during assessing phase', async () => {
    const user = userEvent.setup()
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    await user.click(screen.getByText('Grabar'))
    await user.click(screen.getByText('Detener Grabación'))
    expect(screen.getByText('Analizando pronunciación…')).toBeInTheDocument()
  })

  it('shows feedback panel when result arrives', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    await user.click(screen.getByText('Grabar'))
    await user.click(screen.getByText('Detener Grabación'))

    // Simulate result arriving
    hookState.result = makeResult()
    rerender(
      <PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument()
  })

  it('advances to next item on Siguiente click', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    // Go through recording flow
    await user.click(screen.getByText('Grabar'))
    await user.click(screen.getByText('Detener Grabación'))
    hookState.result = makeResult()
    rerender(
      <PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    await user.click(screen.getByText('Siguiente'))
    expect(screen.getByText('Buenos días, señor.')).toBeInTheDocument()
    expect(screen.getByText('Pronunciación · 2/2')).toBeInTheDocument()
  })

  it('returns to answering on Repetir click', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    await user.click(screen.getByText('Grabar'))
    await user.click(screen.getByText('Detener Grabación'))
    hookState.result = makeResult()
    rerender(
      <PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    await user.click(screen.getByText('Repetir'))
    expect(screen.getByText('Grabar')).toBeInTheDocument()
    expect(mockReset).toHaveBeenCalled()
  })

  it('shows done screen after last item', async () => {
    const user = userEvent.setup()
    const singleItem = [makeItem('1', 'Test sentence')]
    const { rerender } = render(
      <PronunciationSession items={singleItem} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    await user.click(screen.getByText('Grabar'))
    await user.click(screen.getByText('Detener Grabación'))
    hookState.result = makeResult()
    rerender(
      <PronunciationSession items={singleItem} l1Language={null} sessionUrl="/pronunciation/session" />,
    )
    await user.click(screen.getByText('Finalizar'))
    expect(screen.getByTestId('summary')).toBeInTheDocument()
  })

  it('displays error message for not-allowed', () => {
    hookState.error = 'not-allowed'
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByText(/Permiso de micrófono denegado/)).toBeInTheDocument()
  })

  it('displays error message for network error', () => {
    hookState.error = 'network'
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByText(/Error de conexión/)).toBeInTheDocument()
  })

  it('renders exit link to pronunciation hub', () => {
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByLabelText('Salir')).toHaveAttribute('href', '/pronunciation')
  })

  it('renders SpeakButton for native audio', () => {
    render(<PronunciationSession items={defaultItems} l1Language={null} sessionUrl="/pronunciation/session" />)
    expect(screen.getByTestId('speak-btn')).toBeInTheDocument()
  })
})
