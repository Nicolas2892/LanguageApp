import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConceptPicker } from '../ConceptPicker'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const modules = [
  { id: 'mod-1', title: 'Connectors' },
  { id: 'mod-2', title: 'Subjunctive' },
]

const units = [
  { id: 'unit-1', module_id: 'mod-1', title: 'Concessive' },
  { id: 'unit-2', module_id: 'mod-2', title: 'Present Triggers' },
]

const concepts = [
  { id: 'c1', unit_id: 'unit-1', title: 'Sin embargo', difficulty: 1, level: 'B1' },
  { id: 'c2', unit_id: 'unit-1', title: 'Aunque + indicativo', difficulty: 2, level: 'B2' },
  { id: 'c3', unit_id: 'unit-2', title: 'Querer que', difficulty: 3, level: 'B2', interval_days: 21 },
]

describe('ConceptPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Rendering ---

  it('renders all module headings', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('Connectors')).toBeTruthy()
    expect(screen.getByText('Subjunctive')).toBeTruthy()
  })

  it('renders all unit headings', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('Concessive')).toBeTruthy()
    expect(screen.getByText('Present Triggers')).toBeTruthy()
  })

  it('renders all concept titles', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('Sin embargo')).toBeTruthy()
    expect(screen.getByText('Aunque + indicativo')).toBeTruthy()
    expect(screen.getByText('Querer que')).toBeTruthy()
  })

  it('renders a Dominado badge for concepts with interval_days >= 21', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    // filter button + mastery badge = 2 occurrences
    expect(screen.getAllByText('Dominado')).toHaveLength(2)
  })

  it('does not render a Dominado badge for unmastered concepts', () => {
    const unmastered = [{ id: 'c1', unit_id: 'unit-1', title: 'Sin embargo', difficulty: 1, level: 'B1', interval_days: 5 }]
    render(<ConceptPicker modules={modules} units={units} concepts={unmastered} suggestedId={null} />)
    // only the filter button — no mastery badge
    expect(screen.getAllByText('Dominado')).toHaveLength(1)
  })

  // --- Initial selection state ---

  it('starts with no checkboxes checked when suggestedId is null', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes.every((cb) => !cb.checked)).toBe(true)
  })

  it('pre-checks the concept matching suggestedId', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId="c2" />)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const checked = checkboxes.filter((cb) => cb.checked)
    expect(checked).toHaveLength(1)
    // The checked checkbox should be for c2 (Aunque + indicativo)
    expect(checked[0].closest('label')?.textContent).toContain('Aunque + indicativo')
  })

  // --- Start button disabled state ---

  it('Start button is disabled when nothing selected', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('Empezar a Escribir →').closest('button')).toBeDisabled()
  })

  it('Start button is enabled when at least one concept selected', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    expect(screen.getByText('Empezar a Escribir →').closest('button')).not.toBeDisabled()
  })

  // --- Checkbox toggle ---

  it('checks a concept on click and shows selection count', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    expect(screen.getByText('1 concepto seleccionado')).toBeTruthy()
  })

  it('unchecks a concept on second click', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[0])
    // Nothing selected — count should not be shown
    expect(screen.queryByText(/concepto seleccionado/)).toBeNull()
    expect(screen.getByText('Empezar a Escribir →').closest('button')).toBeDisabled()
  })

  it('uses plural "conceptos seleccionados" for multiple selections', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])
    expect(screen.getByText('2 conceptos seleccionados')).toBeTruthy()
  })

  // --- Difficulty labels ---

  it('shows "Enfocado — un concepto" for 1 selection', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(screen.getByText('Enfocado — un concepto')).toBeTruthy()
  })

  it('shows "Síntesis — dos estructuras" for 2 selections', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])
    expect(screen.getByText('Síntesis — dos estructuras')).toBeTruthy()
  })

  it('shows "Desafío — varias estructuras" for 3+ selections', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])
    await userEvent.click(checkboxes[2])
    expect(screen.getByText('Desafío — varias estructuras')).toBeTruthy()
  })

  it('does not show difficulty label when nothing selected', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.queryByText('Enfocado — un concepto')).toBeNull()
    expect(screen.queryByText('Síntesis — dos estructuras')).toBeNull()
    expect(screen.queryByText('Desafío — varias estructuras')).toBeNull()
  })

  // --- router.push on Start ---

  it('calls router.push with correct URL for single concept', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // c1
    await userEvent.click(screen.getByText('Empezar a Escribir →'))
    expect(mockPush).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('c1'))
    expect(mockPush.mock.calls[0][0]).toMatch(/^\/write\?concepts=/)
  })

  it('calls router.push with comma-separated ids for multiple concepts', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // c1
    await userEvent.click(checkboxes[1]) // c2
    await userEvent.click(screen.getByText('Empezar a Escribir →'))
    const url: string = mockPush.mock.calls[0][0]
    expect(url).toMatch(/^\/write\?concepts=/)
    expect(url).toContain('c1')
    expect(url).toContain('c2')
  })

  it('does not call router.push when nothing is selected', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByText('Empezar a Escribir →'))
    expect(mockPush).not.toHaveBeenCalled()
  })

  // --- Surprise me ---

  it('Sorpréndeme selects exactly 1 concept when random returns 0', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)   // count = Math.floor(0*3)+1 = 1
      .mockReturnValue(0.4)     // for shuffle comparisons
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: /Sorpréndeme/ }))
    expect(screen.getByText('1 concepto seleccionado')).toBeTruthy()
    expect(screen.getByText('Enfocado — un concepto')).toBeTruthy()
  })

  it('Sorpréndeme selects exactly 3 concepts when random returns 0.99 first', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)  // count = Math.floor(0.99*3)+1 = 3
      .mockReturnValue(0.4)
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: /Sorpréndeme/ }))
    expect(screen.getByText('3 conceptos seleccionados')).toBeTruthy()
    expect(screen.getByText('Desafío — varias estructuras')).toBeTruthy()
  })

  it('Sorpréndeme enables the Start button', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: /Sorpréndeme/ }))
    expect(screen.getByText('Empezar a Escribir →').closest('button')).not.toBeDisabled()
  })

  // --- New tests (UX-F) ---

  it('renders LevelChip for each concept', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('B1')).toBeTruthy()
    expect(screen.getAllByText('B2')).toHaveLength(2)
  })

  it('mastery filter "Nuevo" shows only unstarted concepts', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo' }))
    expect(screen.getByText('Sin embargo')).toBeTruthy()
    expect(screen.getByText('Aunque + indicativo')).toBeTruthy()
    expect(screen.queryByText('Querer que')).toBeNull()
  })

  it('mastery filter "Dominado" shows only mastered concepts', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dominado' }))
    expect(screen.getByText('Querer que')).toBeTruthy()
    expect(screen.queryByText('Sin embargo')).toBeNull()
    expect(screen.queryByText('Aunque + indicativo')).toBeNull()
  })

  it('mastery filter "Aprendiendo" shows empty state when no learning concepts', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aprendiendo' }))
    expect(screen.getByText(/Aún no hay conceptos aprendiendo/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mostrar todos' })).toBeTruthy()
  })

  it('"Mostrar todos" in empty state resets filter and shows all concepts', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aprendiendo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar todos' }))
    expect(screen.getByText('Sin embargo')).toBeTruthy()
    expect(screen.getByText('Querer que')).toBeTruthy()
  })

  it('"Borrar todo" button appears after selecting a concept', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.queryByText('Borrar todo')).toBeNull()
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(screen.getByText('Borrar todo')).toBeTruthy()
  })

  it('"Borrar todo" resets selection and disables Start button', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    await userEvent.click(screen.getAllByRole('checkbox')[1])
    expect(screen.getByText('2 conceptos seleccionados')).toBeTruthy()
    await userEvent.click(screen.getByText('Borrar todo'))
    expect(screen.queryByText(/concepto seleccionado/)).toBeNull()
    expect(screen.getByText('Empezar a Escribir →').closest('button')).toBeDisabled()
  })

  it('"¿No sabes por dónde empezar?" card is rendered', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('¿No sabes por dónde empezar?')).toBeTruthy()
  })
})
