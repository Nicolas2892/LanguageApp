import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListeningComprehension, parseListeningPrompt } from '../ListeningComprehension'
import type { Exercise } from '@/lib/supabase/types'

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, enabled: true, toggle: vi.fn() }),
}))

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    concept_id: '00000000-0000-0000-0000-000000000002',
    type: 'listening',
    prompt: 'PASSAGE: Si bien la nueva ley pretende frenar la especulación, los analistas señalan que podría generar un efecto contrario.\nQUESTION: ¿Cuál es la paradoja que señalan los analistas?',
    expected_answer: 'Que la ley podría empeorar la situación al reducir la oferta.',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('parseListeningPrompt', () => {
  it('splits prompt into passage and question', () => {
    const result = parseListeningPrompt(
      'PASSAGE: Some passage text.\nQUESTION: What happened?'
    )
    expect(result.passage).toBe('Some passage text.')
    expect(result.question).toBe('What happened?')
  })

  it('handles prompt without PASSAGE: prefix', () => {
    const result = parseListeningPrompt(
      'Some passage text.\nQUESTION: What happened?'
    )
    expect(result.passage).toBe('Some passage text.')
    expect(result.question).toBe('What happened?')
  })

  it('returns full prompt as passage when no QUESTION marker', () => {
    const result = parseListeningPrompt('Just some text without markers')
    expect(result.passage).toBe('Just some text without markers')
    expect(result.question).toBe('')
  })
})

describe('ListeningComprehension', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders the play button initially', () => {
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Reproducir pasaje')).toBeTruthy()
  })

  it('renders the comprehension question', () => {
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('¿Cuál es la paradoja que señalan los analistas?')).toBeTruthy()
  })

  it('renders the Comprensión Auditiva eyebrow', () => {
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Comprensión Auditiva')).toBeTruthy()
  })

  it('submit button is disabled when textarea is empty', () => {
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('enables submit button once text is entered', async () => {
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    await userEvent.type(textarea, 'La ley podría empeorar la situación.')
    expect(screen.getByRole('button', { name: 'Confirmar →' })).not.toBeDisabled()
  })

  it('calls onSubmit with trimmed value', async () => {
    const onSubmit = vi.fn()
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    await userEvent.type(textarea, 'La paradoja es clara.')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('La paradoja es clara.')
  })

  it('disables controls when disabled=true', () => {
    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
    expect(screen.getByLabelText('Reproducir pasaje')).toBeDisabled()
  })

  it('fetches TTS audio when play button is clicked', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
    const mockResponse = { ok: true, blob: () => Promise.resolve(mockBlob) }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    // Mock Audio constructor
    const playMock = vi.fn()
    vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({ play: playMock })))

    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Reproducir pasaje'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }))
    })
  })

  it('shows replay button after first play', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(mockBlob) }))
    vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({ play: vi.fn() })))
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:test') })

    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Reproducir pasaje'))

    await waitFor(() => {
      expect(screen.getByLabelText('Escuchar de nuevo')).toBeTruthy()
    })
  })

  it('shows error message when TTS fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
    }))

    render(<ListeningComprehension exercise={makeExercise()} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Reproducir pasaje'))

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeTruthy()
    })
  })
})
