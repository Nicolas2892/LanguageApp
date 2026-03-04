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
    created_at: '2026-01-01',
    ...overrides,
  }
}

// --- Single-blank mode ---

describe('GapFill — single-blank mode (legacy compat)', () => {
  it('renders prompt as <p> and a single input below', () => {
    const exercise = makeExercise({ prompt: 'La película es larga; ___, me gustó.' })
    render(<GapFill exercise={exercise} onSubmit={vi.fn()} />)
    expect(screen.getByText(exercise.prompt)).toBeTruthy()
    expect(screen.getByPlaceholderText('Type your answer…')).toBeTruthy()
    expect(screen.getByPlaceholderText('Type your answer…').tagName).toBe('INPUT')
  })

  it('calls onSubmit with trimmed plain string', async () => {
    const onSubmit = vi.fn()
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Yo ___ estudiante.' })}
        onSubmit={onSubmit}
      />
    )
    await userEvent.type(screen.getByPlaceholderText('Type your answer…'), '  soy  ')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(onSubmit).toHaveBeenCalledWith('soy')
  })

  it('Submit is disabled when input is empty', () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Yo ___ estudiante.' })}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })

  it('disables input and button when disabled=true', () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: 'Yo ___ estudiante.' })}
        onSubmit={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByPlaceholderText('Type your answer…')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })

  it('prompt with no blank tokens renders as single-blank fallback', () => {
    // A prompt with zero ___ tokens — countBlanks = 0 → single-blank fallback
    const exercise = makeExercise({ prompt: 'La película es muy larga. Me ha gustado mucho.' })
    render(<GapFill exercise={exercise} onSubmit={vi.fn()} />)
    expect(screen.getByPlaceholderText('Type your answer…')).toBeTruthy()
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
    expect(screen.getByLabelText('Blank 1')).toBeTruthy()
    expect(screen.getByLabelText('Blank 2')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Type your answer…')).toBeNull()
  })

  it('each input has correct aria-label', () => {
    const prompt = 'A ___ B ___ C ___ D'
    render(
      <GapFill
        exercise={makeExercise({ prompt })}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Blank 1')).toBeTruthy()
    expect(screen.getByLabelText('Blank 2')).toBeTruthy()
    expect(screen.getByLabelText('Blank 3')).toBeTruthy()
  })

  it('Submit is disabled until ALL blanks are filled', async () => {
    render(
      <GapFill
        exercise={makeExercise({ prompt: multiPrompt })}
        onSubmit={vi.fn()}
      />
    )
    const submitBtn = screen.getByRole('button', { name: 'Submit' })
    expect(submitBtn).toBeDisabled()

    // Fill only first blank — still disabled
    await userEvent.type(screen.getByLabelText('Blank 1'), 'Aunque')
    expect(submitBtn).toBeDisabled()

    // Fill second blank — now enabled
    await userEvent.type(screen.getByLabelText('Blank 2'), 'Sin embargo')
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
    await userEvent.type(screen.getByLabelText('Blank 1'), '  sin embargo  ')
    await userEvent.type(screen.getByLabelText('Blank 2'), '  aunque  ')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
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
    expect(screen.getByLabelText('Blank 1')).toBeDisabled()
    expect(screen.getByLabelText('Blank 2')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })
})
