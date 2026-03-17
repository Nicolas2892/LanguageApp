import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FreeWritePrompt } from '../FreeWritePrompt'
import type { UseSpeechRecognitionReturn } from '@/lib/hooks/useSpeechRecognition'

// Default STT state — supported and idle
const defaultStt: UseSpeechRecognitionReturn = {
  supported: true,
  listening: false,
  processing: false,
  transcript: '',
  error: null,
  permissionState: 'unknown',
  start: vi.fn(),
  stop: vi.fn(),
}

const mockUseSpeechRecognition = vi.fn(() => defaultStt)

vi.mock('@/lib/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => mockUseSpeechRecognition(),
}))

// Enable SpeakButton
vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, enabled: true, toggle: vi.fn() }),
}))

const baseProps = {
  prompt: 'Write about a typical day in your city.',
  conceptTitle: 'Subjuntivo presente',
  onSubmit: vi.fn(),
  onRefreshPrompt: vi.fn(),
  disabled: false,
  loadingPrompt: false,
}

function words(n: number) {
  return Array(n).fill('palabra').join(' ')
}

describe('FreeWritePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSpeechRecognition.mockReturnValue(defaultStt)
  })

  // --- Rendering ---

  it('renders the concept title', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByText('Subjuntivo presente')).toBeTruthy()
  })

  it('renders the AI prompt text when not loading', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByText('Write about a typical day in your city.')).toBeTruthy()
  })

  it('hides prompt text and shows skeleton while loading', () => {
    render(<FreeWritePrompt {...baseProps} loadingPrompt={true} />)
    expect(screen.queryByText('Write about a typical day in your city.')).toBeNull()
  })

  it('shows initial word counter at 0', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByText('0 / 200 palabras')).toBeTruthy()
  })

  // --- Word counter updates ---

  it('updates word counter as user types', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: 'hola mundo' } })
    expect(screen.getByText('2 / 200 palabras')).toBeTruthy()
  })

  it('counts words correctly for multi-space input', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: '  uno  dos  tres  ' } })
    expect(screen.getByText('3 / 200 palabras')).toBeTruthy()
  })

  // --- Word limit colour states ---

  it('counter is muted (no warning class) when under 150 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(50) } })
    const counter = screen.getByText('50 / 200 palabras')
    expect(counter.className).toContain('text-muted-foreground')
    expect(counter.className).not.toContain('text-[var(--d5-warning)]')
    expect(counter.className).not.toContain('text-[var(--d5-error)]')
  })

  it('counter turns amber at 150 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(150) } })
    const counter = screen.getByText('150 / 200 palabras')
    expect(counter.className).toContain('text-[var(--d5-warning)]')
  })

  it('counter turns red above 200 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(201) } })
    const counter = screen.getByText('201 / 200 palabras')
    expect(counter.className).toContain('text-[var(--d5-error)]')
  })

  // --- Submit button disabled states ---

  it('Submit is disabled when answer is empty', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const submit = screen.getByText('Enviar →')
    expect(submit.closest('button')).toBeDisabled()
  })

  it('Submit is disabled when answer is below 20 words (underMinimum)', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(10) } })
    expect(screen.getByText('Enviar →').closest('button')).toBeDisabled()
  })

  it('Submit is enabled at exactly 20 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(20) } })
    expect(screen.getByText('Enviar →').closest('button')).not.toBeDisabled()
  })

  it('Submit is enabled at exactly 200 words', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(200) } })
    expect(screen.getByText('Enviar →').closest('button')).not.toBeDisabled()
  })

  it('Submit is disabled above 200 words (overLimit)', () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(201) } })
    expect(screen.getByText('Enviar →').closest('button')).toBeDisabled()
  })

  // --- onSubmit callback ---

  it('calls onSubmit with trimmed answer when valid', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: '  ' + words(25) + '  ' } })
    await userEvent.click(screen.getByText('Enviar →'))
    expect(baseProps.onSubmit).toHaveBeenCalledOnce()
    expect(baseProps.onSubmit).toHaveBeenCalledWith(words(25))
  })

  it('does not call onSubmit when under 20 words', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(5) } })
    await userEvent.click(screen.getByText('Enviar →'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onSubmit when over 200 words', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    fireEvent.change(textarea, { target: { value: words(201) } })
    await userEvent.click(screen.getByText('Enviar →'))
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
  })

  // --- Refresh prompt ---

  it('calls onRefreshPrompt when refresh button is clicked', async () => {
    render(<FreeWritePrompt {...baseProps} />)
    await userEvent.click(screen.getByText('Generar otro tema'))
    expect(baseProps.onRefreshPrompt).toHaveBeenCalledOnce()
  })

  // --- Disabled prop ---

  it('disables both buttons when disabled=true', () => {
    render(<FreeWritePrompt {...baseProps} disabled={true} />)
    expect(screen.getByText('Generar otro tema').closest('button')).toBeDisabled()
    expect(screen.getByText('Enviar →').closest('button')).toBeDisabled()
  })

  it('disables textarea when disabled=true', () => {
    render(<FreeWritePrompt {...baseProps} disabled={true} />)
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…')).toBeDisabled()
  })

  it('disables textarea and buttons while loading prompt', () => {
    render(<FreeWritePrompt {...baseProps} loadingPrompt={true} />)
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…')).toBeDisabled()
    expect(screen.getByText('Generar otro tema').closest('button')).toBeDisabled()
  })

  // --- TTS (SpeakButton) ---

  it('renders SpeakButton (Play audio) when prompt is loaded', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Reproducir audio')).toBeTruthy()
  })

  it('does not render SpeakButton while prompt is loading', () => {
    render(<FreeWritePrompt {...baseProps} loadingPrompt={true} />)
    expect(screen.queryByLabelText('Reproducir audio')).toBeNull()
  })

  // --- STT (MicButton) ---

  it('renders the mic dictation button when STT is supported', () => {
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Iniciar dictado')).toBeTruthy()
  })

  it('renders mic-off button when STT is not supported', () => {
    mockUseSpeechRecognition.mockReturnValue({ ...defaultStt, supported: false })
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Dictación no disponible')).toBeTruthy()
  })

  it('renders mic-off button when permission is denied', () => {
    mockUseSpeechRecognition.mockReturnValue({ ...defaultStt, permissionState: 'denied' })
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Acceso al micrófono denegado')).toBeTruthy()
  })

  it('mic button is disabled when loadingPrompt=true', () => {
    render(<FreeWritePrompt {...baseProps} loadingPrompt={true} />)
    const dictateBtn = screen.queryByLabelText('Iniciar dictado')
    if (dictateBtn) {
      expect((dictateBtn as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('mic button shows listening state while recording', () => {
    mockUseSpeechRecognition.mockReturnValue({ ...defaultStt, listening: true })
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Detener dictado')).toBeTruthy()
  })

  it('mic button shows processing state while transcribing', () => {
    mockUseSpeechRecognition.mockReturnValue({ ...defaultStt, processing: true })
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Procesando audio')).toBeTruthy()
  })

  it('shows not-supported fallback with "Dictación no disponible" label', () => {
    mockUseSpeechRecognition.mockReturnValue({ ...defaultStt, supported: false })
    render(<FreeWritePrompt {...baseProps} />)
    expect(screen.getByLabelText('Dictación no disponible')).toBeTruthy()
  })
})
