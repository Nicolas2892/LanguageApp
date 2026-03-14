import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterShift, parseRegisterPrompt } from '../RegisterShift'
import type { Exercise } from '@/lib/supabase/types'

vi.mock('@/lib/hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: vi.fn(), speaking: false, enabled: true, toggle: vi.fn() }),
}))

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    concept_id: '00000000-0000-0000-0000-000000000002',
    type: 'register_shift',
    prompt: 'SOURCE_REGISTER: informal\nTARGET_REGISTER: formal\nCONTEXT: Reescribe este mensaje para enviarlo como correo a tu supervisor.\nTEXT: Bueno, pues al final el proyecto salió bien aunque tuvimos un montón de problemas.',
    expected_answer: 'En definitiva, el proyecto concluyó satisfactoriamente si bien nos enfrentamos a numerosos obstáculos.',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('parseRegisterPrompt', () => {
  it('parses all fields correctly', () => {
    const result = parseRegisterPrompt(
      'SOURCE_REGISTER: informal\nTARGET_REGISTER: formal\nCONTEXT: Rewrite for work.\nTEXT: Hey, what is up?'
    )
    expect(result.sourceRegister).toBe('informal')
    expect(result.targetRegister).toBe('formal')
    expect(result.context).toBe('Rewrite for work.')
    expect(result.text).toBe('Hey, what is up?')
  })

  it('handles multi-line text', () => {
    const result = parseRegisterPrompt(
      'SOURCE_REGISTER: coloquial\nTARGET_REGISTER: académico\nCONTEXT: For a paper.\nTEXT: First line.\nSecond line.'
    )
    expect(result.text).toBe('First line.\nSecond line.')
  })

  it('handles missing fields gracefully', () => {
    const result = parseRegisterPrompt('Just some text without markers')
    expect(result.sourceRegister).toBe('')
    expect(result.targetRegister).toBe('')
    expect(result.context).toBe('')
    expect(result.text).toBe('Just some text without markers')
  })

  it('normalizes register to lowercase', () => {
    const result = parseRegisterPrompt(
      'SOURCE_REGISTER: Informal\nTARGET_REGISTER: FORMAL\nTEXT: test'
    )
    expect(result.sourceRegister).toBe('informal')
    expect(result.targetRegister).toBe('formal')
  })
})

describe('RegisterShift', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Cambio De Registro eyebrow', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Cambio De Registro')).toBeTruthy()
  })

  it('renders source register badge', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Informal')).toBeTruthy()
  })

  it('renders target register badge', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText('Formal')).toBeTruthy()
  })

  it('renders the source text', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/Bueno, pues al final/)).toBeTruthy()
  })

  it('renders the context instruction', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/Reescribe este mensaje para enviarlo como correo/)).toBeTruthy()
  })

  it('submit button is disabled when textarea is empty', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('enables submit button once text is entered', async () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en el nuevo registro…')
    await userEvent.type(textarea, 'En definitiva, el proyecto concluyó.')
    expect(screen.getByRole('button', { name: 'Confirmar →' })).not.toBeDisabled()
  })

  it('calls onSubmit with trimmed value', async () => {
    const onSubmit = vi.fn()
    render(<RegisterShift exercise={makeExercise()} onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta en el nuevo registro…')
    await userEvent.type(textarea, 'El proyecto concluyó satisfactoriamente.')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar →' }))
    expect(onSubmit).toHaveBeenCalledWith('El proyecto concluyó satisfactoriamente.')
  })

  it('disables textarea and submit when disabled=true', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText('Escribe tu respuesta en el nuevo registro…')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirmar →' })).toBeDisabled()
  })

  it('renders SpeakButton', () => {
    render(<RegisterShift exercise={makeExercise()} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Reproducir audio')).toBeTruthy()
  })

  it('renders register badges for unknown register with fallback style', () => {
    render(<RegisterShift exercise={makeExercise({
      prompt: 'SOURCE_REGISTER: slang\nTARGET_REGISTER: legal\nTEXT: test',
    })} onSubmit={vi.fn()} />)
    expect(screen.getByText('slang')).toBeTruthy()
    expect(screen.getByText('legal')).toBeTruthy()
  })
})
