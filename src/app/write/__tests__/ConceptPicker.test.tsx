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
  { id: 'c1', unit_id: 'unit-1', title: 'Sin embargo', difficulty: 1 },
  { id: 'c2', unit_id: 'unit-1', title: 'Aunque + indicativo', difficulty: 2 },
  { id: 'c3', unit_id: 'unit-2', title: 'Querer que', difficulty: 3, interval_days: 21 },
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

  it('renders a Mastered badge for concepts with interval_days >= 21', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.getByText('Mastered')).toBeTruthy()
  })

  it('does not render a Mastered badge for unmastered concepts', () => {
    const unmastered = [{ id: 'c1', unit_id: 'unit-1', title: 'Sin embargo', difficulty: 1, interval_days: 5 }]
    render(<ConceptPicker modules={modules} units={units} concepts={unmastered} suggestedId={null} />)
    expect(screen.queryByText('Mastered')).toBeNull()
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
    expect(screen.getByText('Start writing →').closest('button')).toBeDisabled()
  })

  it('Start button is enabled when at least one concept selected', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    expect(screen.getByText('Start writing →').closest('button')).not.toBeDisabled()
  })

  // --- Checkbox toggle ---

  it('checks a concept on click and shows selection count', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    expect(screen.getByText('1 concept selected')).toBeTruthy()
  })

  it('unchecks a concept on second click', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[0])
    // Nothing selected — count should not be shown
    expect(screen.queryByText(/concept selected/)).toBeNull()
    expect(screen.getByText('Start writing →').closest('button')).toBeDisabled()
  })

  it('uses plural "concepts selected" for multiple selections', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])
    expect(screen.getByText('2 concepts selected')).toBeTruthy()
  })

  // --- Difficulty labels ---

  it('shows "Focused — single concept" for 1 selection', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(screen.getByText('Focused — single concept')).toBeTruthy()
  })

  it('shows "Synthesis — two structures" for 2 selections', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])
    expect(screen.getByText('Synthesis — two structures')).toBeTruthy()
  })

  it('shows "Challenge — multi-concept" for 3+ selections', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])
    await userEvent.click(checkboxes[2])
    expect(screen.getByText('Challenge — multi-concept')).toBeTruthy()
  })

  it('does not show difficulty label when nothing selected', () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    expect(screen.queryByText('Focused — single concept')).toBeNull()
    expect(screen.queryByText('Synthesis — two structures')).toBeNull()
    expect(screen.queryByText('Challenge — multi-concept')).toBeNull()
  })

  // --- router.push on Start ---

  it('calls router.push with correct URL for single concept', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // c1
    await userEvent.click(screen.getByText('Start writing →'))
    expect(mockPush).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('c1'))
    expect(mockPush.mock.calls[0][0]).toMatch(/^\/write\?concepts=/)
  })

  it('calls router.push with comma-separated ids for multiple concepts', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // c1
    await userEvent.click(checkboxes[1]) // c2
    await userEvent.click(screen.getByText('Start writing →'))
    const url: string = mockPush.mock.calls[0][0]
    expect(url).toMatch(/^\/write\?concepts=/)
    expect(url).toContain('c1')
    expect(url).toContain('c2')
  })

  it('does not call router.push when nothing is selected', async () => {
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByText('Start writing →'))
    expect(mockPush).not.toHaveBeenCalled()
  })

  // --- Surprise me ---

  it('Surprise me selects exactly 1 concept when random returns 0', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)   // count = Math.floor(0*3)+1 = 1
      .mockReturnValue(0.4)     // for shuffle comparisons
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByText('Surprise me 🎲'))
    expect(screen.getByText('1 concept selected')).toBeTruthy()
    expect(screen.getByText('Focused — single concept')).toBeTruthy()
  })

  it('Surprise me selects exactly 3 concepts when random returns 0.99 first', async () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)  // count = Math.floor(0.99*3)+1 = 3
      .mockReturnValue(0.4)
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByText('Surprise me 🎲'))
    expect(screen.getByText('3 concepts selected')).toBeTruthy()
    expect(screen.getByText('Challenge — multi-concept')).toBeTruthy()
  })

  it('Surprise me enables the Start button', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<ConceptPicker modules={modules} units={units} concepts={concepts} suggestedId={null} />)
    await userEvent.click(screen.getByText('Surprise me 🎲'))
    expect(screen.getByText('Start writing →').closest('button')).not.toBeDisabled()
  })
})
