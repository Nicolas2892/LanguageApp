import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Proofreading, parseProofreadingPrompt } from '../Proofreading'
import type { Exercise } from '@/lib/supabase/types'

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, enabled: true, toggle: vi.fn() }),
}))

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    concept_id: '00000000-0000-0000-0000-000000000002',
    type: 'proofreading',
    prompt: 'TEXT: Los profesores quieren que los alumnos estudien más, pero no creen que el problema es solo de motivación. Es importante que los padres participan en la educación.\nERRORS: 2',
    expected_answer: 'Los profesores quieren que los alumnos estudien más, pero no creen que el problema sea solo de motivación. Es importante que los padres participen en la educación.',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('parseProofreadingPrompt', () => {
  it('splits prompt into text and error count', () => {
    const result = parseProofreadingPrompt('TEXT: Some erroneous text.\nERRORS: 3')
    expect(result.text).toBe('Some erroneous text.')
    expect(result.errorCount).toBe(3)
  })

  it('handles prompt without TEXT: prefix', () => {
    const result = parseProofreadingPrompt('Some erroneous text.\nERRORS: 2')
    expect(result.text).toBe('Some erroneous text.')
    expect(result.errorCount).toBe(2)
  })

  it('returns full prompt and 0 errors when no ERRORS marker', () => {
    const result = parseProofreadingPrompt('Just some text')
    expect(result.text).toBe('Just some text')
    expect(result.errorCount).toBe(0)
  })

  it('handles non-numeric error count gracefully', () => {
    const result = parseProofreadingPrompt('TEXT: text\nERRORS: abc')
    expect(result.errorCount).toBe(0)
  })
})

describe('Proofreading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Corrección De Texto eyebrow', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Corrección De Texto')).toBeTruthy()
  })

  it('renders the instruction text', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Encuentra y corrige los errores en el texto')).toBeTruthy()
  })

  it('displays the error count badge', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/Este texto contiene 2 errores/)).toBeTruthy()
  })

  it('displays singular "error" when count is 1', () => {
    render(<Proofreading exercise={makeExercise({
      prompt: 'TEXT: Un solo error.\nERRORS: 1',
    })} onSubmit={vi.fn()} />)
    expect(screen.getByText(/Este texto contiene 1 error$/)).toBeTruthy()
  })

  it('pre-populates the textarea with the erroneous text', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('el problema es solo de motivación')
  })

  it('submit button is enabled since textarea is pre-populated', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).not.toBeDisabled()
  })

  it('calls onSubmit with the edited text', async () => {
    const onSubmit = vi.fn()
    render(<Proofreading exercise={makeExercise()} onSubmit={onSubmit} />)
    // Text is pre-populated, just click submit
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.any(String))
    expect(onSubmit.mock.calls[0][0].length).toBeGreaterThan(0)
  })

  it('disables textarea and submit when disabled=true', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('renders SpeakButton', () => {
    render(<Proofreading exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Reproducir audio')).toBeTruthy()
  })

  it('does not show error badge when count is 0', () => {
    render(<Proofreading exercise={makeExercise({
      prompt: 'TEXT: Some text.\nERRORS: 0',
    })} onSubmit={vi.fn()} />)
    expect(screen.queryByText(/Este texto contiene/)).toBeNull()
  })
})
