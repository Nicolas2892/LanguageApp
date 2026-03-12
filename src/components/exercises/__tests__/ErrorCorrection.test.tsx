import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorCorrection } from '../ErrorCorrection'
import type { Exercise } from '@/lib/supabase/types'

// Enable SpeakButton so we can assert it renders
vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, enabled: true, toggle: vi.fn() }),
}))

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    concept_id: '00000000-0000-0000-0000-000000000002',
    type: 'error_correction',
    prompt: 'Find and correct the error: "El niño come muchos dulces."',
    expected_answer: 'El niño come muchos dulces.',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ErrorCorrection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the prompt text', () => {
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/Find and correct the error/)).toBeTruthy()
  })

  it('extracts and displays the erroneous sentence', () => {
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/Frase errónea/)).toBeTruthy()
  })

  it('submit button is disabled when textarea is empty', () => {
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('enables submit button once text is entered', async () => {
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe la frase corregida…')
    await userEvent.type(textarea, 'El niño come muchos dulces.')
    expect(screen.getByRole('button', { name: 'Confirmar →' })).not.toBeDisabled()
  })

  it('calls onSubmit with trimmed value', async () => {
    const onSubmit = vi.fn()
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText('Escribe la frase corregida…')
    await userEvent.type(textarea, 'El niño come dulces.')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('El niño come dulces.')
  })

  it('disables textarea and submit when disabled=true', () => {
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText('Escribe la frase corregida…')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('renders SpeakButton with Play audio label', () => {
    render(<ErrorCorrection exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Reproducir audio')).toBeTruthy()
  })
})
