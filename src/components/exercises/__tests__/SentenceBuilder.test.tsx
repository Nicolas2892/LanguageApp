import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SentenceBuilder } from '../SentenceBuilder'
import type { Exercise } from '@/lib/supabase/types'

// Enable SpeakButton so we can assert it renders
vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, enabled: true, toggle: vi.fn() }),
}))

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    concept_id: '00000000-0000-0000-0000-000000000002',
    type: 'sentence_builder',
    prompt: 'Build a sentence about the weather. [llueve/hace/frío/mucho]',
    expected_answer: 'Hace mucho frío cuando llueve.',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('SentenceBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the instruction text (without bracket notation)', () => {
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Build a sentence about the weather.')).toBeTruthy()
  })

  it('renders word chips from the bracket notation', () => {
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('llueve')).toBeTruthy()
    expect(screen.getByText('hace')).toBeTruthy()
    expect(screen.getByText('frío')).toBeTruthy()
    expect(screen.getByText('mucho')).toBeTruthy()
  })

  it('renders SpeakButton with Play audio label (main path)', () => {
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Play audio')).toBeTruthy()
  })

  it('renders SpeakButton on fallback path (no bracket notation)', () => {
    render(
      <SentenceBuilder
        exercise={makeExercise({ prompt: 'Translate: The cat is sleeping.' })}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Play audio')).toBeTruthy()
  })

  it('submit is disabled before any word is selected', () => {
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('adds word to selected area when chip is clicked', async () => {
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={vi.fn()} />)
    // Click whichever word is first available — find any chip in the word bank
    const chipButtons = screen.getAllByRole('button').filter(
      (b) => ['llueve', 'hace', 'frío', 'mucho'].includes(b.textContent ?? '')
    )
    await userEvent.click(chipButtons[0])
    // After clicking one word, Submit should become enabled
    expect(screen.getByRole('button', { name: 'Confirmar →' })).not.toBeDisabled()
  })

  it('calls onSubmit with joined selected words', async () => {
    const onSubmit = vi.fn()
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={onSubmit} />)
    // Click each word from the bank individually — re-query each time since
    // clicking moves the button from word bank → selected area
    for (const word of ['llueve', 'hace', 'frío', 'mucho']) {
      // Only click buttons in the word bank (pill-bg), not in the selected area (bg-primary)
      const bankButtons = screen.getAllByRole('button').filter(
        (b) => b.textContent === word && !b.className.includes('bg-primary')
      )
      if (bankButtons.length > 0) await userEvent.click(bankButtons[0])
    }
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    const submitted = (onSubmit.mock.calls[0][0] as string).split(' ')
    expect(submitted).toHaveLength(4)
  })

  it('disables chips and submit when disabled=true', () => {
    render(<SentenceBuilder exercise={makeExercise()} onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })
})
