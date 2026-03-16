import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MicButton } from '../MicButton'
import type { UseSpeechRecognitionReturn } from '@/lib/hooks/useSpeechRecognition'

function makeStt(overrides: Partial<UseSpeechRecognitionReturn> = {}): UseSpeechRecognitionReturn {
  return {
    supported: true,
    listening: false,
    processing: false,
    permissionState: 'unknown',
    error: null,
    transcript: '',
    start: vi.fn(),
    stop: vi.fn(),
    ...overrides,
  }
}

describe('MicButton', () => {
  it('renders Mic icon in idle state', () => {
    render(<MicButton stt={makeStt()} />)
    const btn = screen.getByRole('button', { name: 'Iniciar dictado' })
    expect(btn).toBeInTheDocument()
    expect(screen.queryByText('Toca para detener')).toBeNull()
    expect(screen.queryByTestId('mic-sonar-ring')).toBeNull()
  })

  it('renders Square stop icon when listening', () => {
    render(<MicButton stt={makeStt({ listening: true })} />)
    const btn = screen.getByRole('button', { name: 'Detener dictado' })
    expect(btn).toBeInTheDocument()
  })

  it('renders sonar ring when listening', () => {
    render(<MicButton stt={makeStt({ listening: true })} />)
    const ring = screen.getByTestId('mic-sonar-ring')
    expect(ring).toBeInTheDocument()
    expect(ring.className).toContain('animate-mic-sonar')
  })

  it('renders "Toca para detener" label when listening', () => {
    render(<MicButton stt={makeStt({ listening: true })} />)
    expect(screen.getByText('Toca para detener')).toBeInTheDocument()
  })

  it('does not render sonar ring or label when idle', () => {
    render(<MicButton stt={makeStt({ listening: false })} />)
    expect(screen.queryByTestId('mic-sonar-ring')).toBeNull()
    expect(screen.queryByText('Toca para detener')).toBeNull()
  })

  it('calls stop when clicking while listening', async () => {
    const stop = vi.fn()
    render(<MicButton stt={makeStt({ listening: true, stop })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Detener dictado' }))
    expect(stop).toHaveBeenCalledOnce()
  })

  it('calls start when clicking while idle', async () => {
    const start = vi.fn()
    render(<MicButton stt={makeStt({ start })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar dictado' }))
    expect(start).toHaveBeenCalledOnce()
  })

  it('renders disabled MicOff when not supported', () => {
    render(<MicButton stt={makeStt({ supported: false })} />)
    const btn = screen.getByRole('button', { name: 'Dictación no disponible' })
    expect(btn).toBeDisabled()
  })

  it('renders disabled MicOff when permission denied', () => {
    render(<MicButton stt={makeStt({ permissionState: 'denied' })} />)
    const btn = screen.getByRole('button', { name: 'Acceso al micrófono denegado' })
    expect(btn).toBeDisabled()
  })

  it('renders spinner when processing', () => {
    render(<MicButton stt={makeStt({ processing: true })} />)
    const btn = screen.getByRole('button', { name: 'Procesando audio' })
    expect(btn).toBeDisabled()
  })

  it('shows no-speech error message', () => {
    render(<MicButton stt={makeStt({ error: 'no-speech' })} />)
    expect(screen.getByText(/No se detectó voz/)).toBeInTheDocument()
  })

  it('shows audio-capture error message', () => {
    render(<MicButton stt={makeStt({ error: 'audio-capture' })} />)
    expect(screen.getByText(/No se pudo acceder al micrófono/)).toBeInTheDocument()
  })

  it('shows rate-limit error message', () => {
    render(<MicButton stt={makeStt({ error: 'service-not-allowed' })} />)
    expect(screen.getByText(/Límite de dictados alcanzado/)).toBeInTheDocument()
  })
})
