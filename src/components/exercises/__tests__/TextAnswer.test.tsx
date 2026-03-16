import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { splitPrompt } from '../TextAnswer'
import { TextAnswer } from '../TextAnswer'
import type { Exercise } from '@/lib/supabase/types'

// Mock SpeakButton to avoid TTS side effects
vi.mock('@/components/SpeakButton', () => ({
  SpeakButton: () => null,
}))

vi.mock('@/components/AnnotatedText', () => ({
  AnnotatedText: ({ text }: { text: string }) => <span>{text}</span>,
}))

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    concept_id: 'c-1',
    type: 'translation',
    prompt: 'Translate: "Hola mundo"',
    expected_answer: 'Hello world',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── splitPrompt unit tests ──────────────────────────────────────────────────

describe('splitPrompt', () => {
  it('parses "Translate: sentence" format', () => {
    const result = splitPrompt('Translate: "I would not leave even if she asked me to."')
    expect(result).toEqual({
      instruction: 'Translate',
      source: '"I would not leave even if she asked me to."',
    })
  })

  it('parses "Rewrite using X: sentence" format', () => {
    const result = splitPrompt('Rewrite using "aunque": "Está cansado, pero sigue trabajando."')
    expect(result).toEqual({
      instruction: 'Rewrite using "aunque"',
      source: '"Está cansado, pero sigue trabajando."',
    })
  })

  it('parses "Combine using X: s1 + s2" format', () => {
    const result = splitPrompt('Combine into one sentence using "a pesar de que": "Llovía mucho." + "Fueron a la playa."')
    expect(result).toEqual({
      instruction: 'Combine into one sentence using "a pesar de que"',
      source: '"Llovía mucho." + "Fueron a la playa."',
    })
  })

  it('parses "Base: sentence → instruction" AI-generated format', () => {
    const result = splitPrompt('Base: Tiene mucho dinero, sin embargo no es feliz. → Rewrite using aunque + indicative')
    expect(result).toEqual({
      instruction: 'Rewrite using aunque + indicative',
      source: 'Tiene mucho dinero, sin embargo no es feliz.',
    })
  })

  it('parses prompt with trailing arrow hint', () => {
    const result = splitPrompt('Change to future context (use subjunctive): "Cuando llego a casa, como." → "Tomorrow..."')
    expect(result).toEqual({
      instruction: 'Change to future context (use subjunctive)',
      source: '"Cuando llego a casa, como." → "Tomorrow..."',
    })
  })

  it('returns null for unrecognised formats', () => {
    expect(splitPrompt('Just a plain sentence')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(splitPrompt('')).toBeNull()
  })
})

// ── TextAnswer component tests ──────────────────────────────────────────────

describe('TextAnswer', () => {
  it('renders split layout for translation exercises', () => {
    const exercise = makeExercise({ type: 'translation', prompt: 'Translate: "Hola mundo"' })
    render(<TextAnswer exercise={exercise} onSubmit={() => {}} />)

    // Instruction should be visible
    expect(screen.getByText(/↳ Translate/)).toBeTruthy()
    // Source sentence should be visible
    expect(screen.getByText('"Hola mundo"')).toBeTruthy()
  })

  it('renders split layout for transformation exercises', () => {
    const exercise = makeExercise({
      type: 'transformation',
      prompt: 'Rewrite using "aunque": "Está cansado, pero sigue trabajando."',
    })
    render(<TextAnswer exercise={exercise} onSubmit={() => {}} />)

    expect(screen.getByText(/↳ Rewrite using "aunque"/)).toBeTruthy()
  })

  it('renders default layout for free_write exercises (no split)', () => {
    const exercise = makeExercise({ type: 'free_write', prompt: 'Write about your day.' })
    render(<TextAnswer exercise={exercise} onSubmit={() => {}} />)

    // Should render the full prompt as-is, no ↳ prefix
    expect(screen.getByText('Write about your day.')).toBeTruthy()
    expect(screen.queryByText(/↳/)).toBeNull()
  })

  it('falls back to default layout when prompt format is unrecognised', () => {
    const exercise = makeExercise({ type: 'translation', prompt: 'Just a plain prompt' })
    render(<TextAnswer exercise={exercise} onSubmit={() => {}} />)

    expect(screen.getByText('Just a plain prompt')).toBeTruthy()
    expect(screen.queryByText(/↳/)).toBeNull()
  })

  it('submits trimmed answer', async () => {
    const onSubmit = vi.fn()
    const exercise = makeExercise()
    render(<TextAnswer exercise={exercise} onSubmit={onSubmit} />)

    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en español…')
    await userEvent.type(textarea, '  respuesta  ')
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(onSubmit).toHaveBeenCalledWith('respuesta')
  })

  it('disables submit when answer is empty', () => {
    render(<TextAnswer exercise={makeExercise()} onSubmit={() => {}} />)
    const button = screen.getByRole('button', { name: /confirmar/i })
    expect(button).toBeDisabled()
  })
})
