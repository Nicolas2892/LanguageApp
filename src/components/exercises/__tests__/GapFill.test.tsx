import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GapFill } from '../GapFill'
import {
  splitPromptOnBlanks,
  countBlanks,
  parseExpectedAnswers,
  encodeAnswers,
  BLANK_TOKEN,
} from '@/lib/exercises/gapFill'
import type { Exercise } from '@/lib/supabase/types'

// --- Utility functions ---

describe('gapFill utilities', () => {
  describe('splitPromptOnBlanks', () => {
    it('splits a single-blank prompt into 2 segments', () => {
      expect(splitPromptOnBlanks('Foo ___ bar')).toEqual(['Foo ', ' bar'])
    })

    it('splits a multi-blank prompt into N+1 segments', () => {
      expect(splitPromptOnBlanks('A ___ B ___ C')).toEqual(['A ', ' B ', ' C'])
    })

    it('returns single-element array when no blanks present', () => {
      expect(splitPromptOnBlanks('No blanks here')).toEqual(['No blanks here'])
    })
  })

  describe('countBlanks', () => {
    it('counts zero blanks for a plain string', () => {
      expect(countBlanks('No blanks')).toBe(0)
    })

    it('counts one blank', () => {
      expect(countBlanks('One ___ blank')).toBe(1)
    })

    it('counts two blanks', () => {
      expect(countBlanks('___ first and ___ second')).toBe(2)
    })

    it('counts three blanks', () => {
      expect(countBlanks('___ a ___ b ___ c')).toBe(3)
    })
  })

  describe('parseExpectedAnswers', () => {
    it('returns null for null input', () => {
      expect(parseExpectedAnswers(null)).toBeNull()
    })

    it('returns null for a plain string (single-blank)', () => {
      expect(parseExpectedAnswers('sin embargo')).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      expect(parseExpectedAnswers('{invalid}')).toBeNull()
    })

    it('returns null when JSON is not an array', () => {
      expect(parseExpectedAnswers('{"key":"value"}')).toBeNull()
    })

    it('returns the array for a valid JSON string[]', () => {
      expect(parseExpectedAnswers('["sin embargo","aunque"]')).toEqual(['sin embargo', 'aunque'])
    })

    it('returns null when array contains non-strings', () => {
      expect(parseExpectedAnswers('[1,2]')).toBeNull()
    })
  })

  describe('encodeAnswers', () => {
    it('joins answers with pipe delimiter', () => {
      expect(encodeAnswers(['sin embargo', 'aunque'])).toBe('sin embargo | aunque')
    })

    it('handles single-element array', () => {
      expect(encodeAnswers(['hola'])).toBe('hola')
    })

    it('handles three answers', () => {
      expect(encodeAnswers(['a', 'b', 'c'])).toBe('a | b | c')
    })
  })

  it('BLANK_TOKEN is three underscores', () => {
    expect(BLANK_TOKEN).toBe('___')
  })
})

// --- Test helpers ---

function makeExercise(overrides: Partial<Exercise> & { type?: string } = {}): Exercise {
  return {
    id: 'ex-1',
    concept_id: 'con-1',
    type: 'gap_fill',
    prompt: 'Test prompt',
    expected_answer: 'expected',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
    created_at: '2026-01-01',
    ...overrides,
  }
}

// --- Single-blank inline mode ---

describe('GapFill — single-blank inline mode', () => {
  it('renders a single inline input with aria-label "Your answer"', () => {
    const exercise = makeExercise({ prompt: 'La película es larga; ___, me gustó.' })
    render(<GapFill exercise={exercise} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Tu respuesta')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Escribe tu respuesta…')).toBeNull()
  })

  it('calls onSubmit with trimmed plain string', async () => {
    const onSubmit = vi.fn()
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Yo ___ estudiante.' })}
        onSubmit={onSubmit}
      />
    )
    await userEvent.type(screen.getByLabelText('Tu respuesta'), '  soy  ')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('soy')
  })

  it('Submit is disabled when input is empty', () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Yo ___ estudiante.' })}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('disables input and button when disabled=true', () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Yo ___ estudiante.' })}
        onSubmit={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByLabelText('Tu respuesta')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('Enter key in single blank moves focus to Submit button', async () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Aunque ___ frío, salimos.' })}
        onSubmit={vi.fn()}
      />
    )
    const blank = screen.getByLabelText('Tu respuesta')
    await userEvent.type(blank, 'hacía')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toHaveFocus()
  })
})

// --- Zero-blank fallback mode ---

describe('GapFill — zero-blank fallback', () => {
  it('renders prompt as <p> and a separate input below when no blanks present', () => {
    const exercise = makeExercise({ prompt: 'La película es muy larga. Me ha gustado mucho.' })
    render(<GapFill exercise={exercise} onSubmit={vi.fn()} />)
    expect(screen.getByPlaceholderText('Escribe tu respuesta…')).toBeTruthy()
  })
})

// --- Multi-blank mode ---

describe('GapFill — multi-blank mode', () => {
  const multiPrompt = '___ hacía calor, los niños salieron. ___, al volver, estaban agotados.'

  it('renders N inline inputs for N blanks (no plain input below)', () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Hueco 1')).toBeTruthy()
    expect(screen.getByLabelText('Hueco 2')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Escribe tu respuesta…')).toBeNull()
  })

  it('each input has correct aria-label', () => {
    const prompt = 'A ___ B ___ C ___ D'
    render(
      <GapFill
        exercise={makeExercise({ prompt })}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Hueco 1')).toBeTruthy()
    expect(screen.getByLabelText('Hueco 2')).toBeTruthy()
    expect(screen.getByLabelText('Hueco 3')).toBeTruthy()
  })

  it('Submit is disabled until ALL blanks are filled', async () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={vi.fn()}
      />
    )
    const submitBtn = screen.getByRole('button', { name: 'Confirmar →' })
    expect(submitBtn).toBeDisabled()

    // Fill only first blank — still disabled
    await userEvent.type(screen.getByLabelText('Hueco 1'), 'Aunque')
    expect(submitBtn).toBeDisabled()

    // Fill second blank — now enabled
    await userEvent.type(screen.getByLabelText('Hueco 2'), 'Sin embargo')
    expect(submitBtn).not.toBeDisabled()
  })

  it('calls onSubmit with pipe-delimited string, trimming each blank', async () => {
    const onSubmit = vi.fn()
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={onSubmit}
      />
    )
    await userEvent.type(screen.getByLabelText('Hueco 1'), '  sin embargo  ')
    await userEvent.type(screen.getByLabelText('Hueco 2'), '  aunque  ')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('sin embargo | aunque')
  })

  it('disables all inputs and button when disabled=true', () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByLabelText('Hueco 1')).toBeDisabled()
    expect(screen.getByLabelText('Hueco 2')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('Enter in first blank moves focus to second blank', async () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={vi.fn()}
      />
    )
    const blank1 = screen.getByLabelText('Hueco 1')
    await userEvent.type(blank1, 'Aunque')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByLabelText('Hueco 2')).toHaveFocus()
  })

  it('Enter in last blank moves focus to Submit button', async () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={vi.fn()}
      />
    )
    // Fill both blanks so Submit is enabled and can receive focus
    await userEvent.type(screen.getByLabelText('Hueco 1'), 'Aunque')
    await userEvent.type(screen.getByLabelText('Hueco 2'), 'Sin embargo')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toHaveFocus()
  })
})
