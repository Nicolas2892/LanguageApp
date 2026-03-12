import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseRenderer } from '../ExerciseRenderer'
import type { Exercise } from '@/lib/supabase/types'

function makeExercise(overrides: Partial<Exercise> & { type: string }): Exercise {
  return {
    id: 'ex-1',
    concept_id: 'con-1',
    prompt: 'Test prompt',
    expected_answer: 'expected',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    created_at: '2026-01-01',
    ...overrides,
  }
}

describe('ExerciseRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  // --- gap_fill → GapFill (inline input) ---

  it('renders an inline input for single-blank gap_fill', () => {
    const onSubmit = vi.fn()
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'gap_fill', prompt: 'Yo ___ estudiante.' })}
        onSubmit={onSubmit}
        disabled={false}
      />
    )
    expect(screen.getByLabelText('Your answer')).toBeTruthy()
    // Inline input, not textarea
    expect(screen.getByLabelText('Your answer').tagName).toBe('INPUT')
  })

  it('submits gap_fill answer on form submit', async () => {
    const onSubmit = vi.fn()
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'gap_fill', prompt: 'Complete: ___' })}
        onSubmit={onSubmit}
        disabled={false}
      />
    )
    await userEvent.type(screen.getByLabelText('Your answer'), 'soy')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('soy')
  })

  it('renders multiple inline inputs for multi-blank gap_fill', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'gap_fill', prompt: '___ hacía frío, salimos. ___, lo disfrutamos.' })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByLabelText('Blank 1')).toBeTruthy()
    expect(screen.getByLabelText('Blank 2')).toBeTruthy()
  })

  it('submits multi-blank gap_fill answers as pipe-delimited string', async () => {
    const onSubmit = vi.fn()
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'gap_fill', prompt: '___ hacía frío, salimos. ___, lo disfrutamos.' })}
        onSubmit={onSubmit}
        disabled={false}
      />
    )
    await userEvent.type(screen.getByLabelText('Blank 1'), 'Aunque')
    await userEvent.type(screen.getByLabelText('Blank 2'), 'Sin embargo')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('Aunque | Sin embargo')
  })

  // --- transformation → TextAnswer (textarea) ---

  it('renders a textarea for transformation', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'transformation', prompt: 'Transform this sentence.' })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…').tagName).toBe('TEXTAREA')
  })

  // --- translation → TextAnswer ---

  it('renders a textarea for translation', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'translation', prompt: 'Translate this.' })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…').tagName).toBe('TEXTAREA')
  })

  // --- free_write → TextAnswer ---

  it('renders a textarea for free_write', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'free_write', prompt: 'Write freely.' })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…').tagName).toBe('TEXTAREA')
  })

  // --- error_correction → ErrorCorrection ---

  it('renders ErrorCorrection with empty textarea and erroneous sentence in read-only callout', () => {
    const prompt = 'Find and correct the error: "El alumno estudia mucho pero no aprueba."'
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'error_correction', prompt })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    // Textarea starts empty
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('')
    // Erroneous sentence shown in read-only callout only
    expect(screen.getByText(/Frase errónea/)).toBeTruthy()
  })

  // --- sentence_builder → SentenceBuilder ---

  it('renders SentenceBuilder word bank for sentence_builder', () => {
    const prompt = 'Arrange: [quiero/ir/al/mercado]'
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'sentence_builder', prompt })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    // All 4 words should appear as clickable buttons in the word bank
    expect(screen.getByRole('button', { name: 'quiero' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'ir' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'al' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'mercado' })).toBeTruthy()
  })

  it('moves word from bank to construction area on click', async () => {
    const prompt = 'Build: [yo/soy/estudiante]'
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'sentence_builder', prompt })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    // Click one of the word bank buttons
    const yoBtn = screen.getByRole('button', { name: 'yo' })
    await userEvent.click(yoBtn)
    // Submit button should now be enabled (something selected)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).not.toBeDisabled()
  })

  // --- disabled prop propagation ---

  it('disables GapFill submit when disabled=true', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'gap_fill', prompt: 'Test' })}
        onSubmit={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByPlaceholderText('Escribe tu respuesta…')).toBeDisabled()
  })

  it('disables TextAnswer submit when disabled=true', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'translation', prompt: 'Test' })}
        onSubmit={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…')).toBeDisabled()
  })

  it('disables ErrorCorrection controls when disabled=true', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'error_correction', prompt: 'Fix: "error aqui."' })}
        onSubmit={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  // --- unknown type falls back to TextAnswer ---

  it('falls back to TextAnswer for unknown exercise type', () => {
    render(
      <ExerciseRenderer
        exercise={makeExercise({ type: 'unknown_future_type', prompt: 'Test' })}
        onSubmit={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByPlaceholderText('Escribe tu respuesta en español…')).toBeTruthy()
  })
})
