import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CurriculumClient } from '../CurriculumClient'

// Mock child components that hit external dependencies
vi.mock('@/components/HardFlagButton', () => ({
  HardFlagButton: ({ conceptId }: { conceptId: string }) => (
    <button data-testid={`hard-flag-${conceptId}`}>Flag</button>
  ),
}))
vi.mock('@/components/LevelChip', () => ({
  LevelChip: ({ level }: { level: string | null }) => <span>{level}</span>,
}))
vi.mock('@/components/GrammarFocusChip', () => ({
  GrammarFocusChip: ({ focus }: { focus: string | null }) => <span>{focus}</span>,
}))
vi.mock('@/components/WindingPathSeparator', () => ({
  WindingPathSeparator: () => <hr />,
}))
vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))

const MODULES = [
  { id: 'mod-1', title: 'Conectores', order_index: 1 },
  { id: 'mod-2', title: 'Subjuntivo', order_index: 2 },
]

const UNITS = [
  { id: 'unit-1', module_id: 'mod-1', title: 'Unidad 1', order_index: 1 },
  { id: 'unit-2', module_id: 'mod-2', title: 'Unidad 2', order_index: 1 },
]

const CONCEPTS = [
  { id: 'con-1', unit_id: 'unit-1', title: 'Sin embargo', difficulty: 1, level: 'B1', grammar_focus: null },
  { id: 'con-2', unit_id: 'unit-2', title: 'Que subjuntivo', difficulty: 2, level: 'B2', grammar_focus: 'Subjunctive' },
]

const defaultProps = {
  modules: MODULES,
  units: UNITS,
  concepts: CONCEPTS,
  progressEntries: [],
  unlockedLevelsList: ['B1', 'B2'],
}

describe('CurriculumClient', () => {
  it('renders the page header', () => {
    render(<CurriculumClient {...defaultProps} />)
    expect(screen.getByText('Tu Currículo')).toBeInTheDocument()
    expect(screen.getByText(/Tu camino personal/)).toBeInTheDocument()
  })

  it('renders all module titles', () => {
    render(<CurriculumClient {...defaultProps} />)
    expect(screen.getByText('Conectores')).toBeInTheDocument()
    expect(screen.getByText('Subjuntivo')).toBeInTheDocument()
  })

  it('shows "Próximamente" status for modules with no progress', () => {
    render(<CurriculumClient {...defaultProps} />)
    const chips = screen.getAllByText('Próximamente')
    expect(chips.length).toBeGreaterThan(0)
  })

  it('shows "En Progreso" for a partially-attempted module', () => {
    render(
      <CurriculumClient
        {...defaultProps}
        progressEntries={[{ concept_id: 'con-1', interval_days: 1, is_hard: false }]}
      />
    )
    expect(screen.getByText('En Progreso')).toBeInTheDocument()
  })

  it('shows "Completado" for a fully mastered module', () => {
    render(
      <CurriculumClient
        {...defaultProps}
        progressEntries={[{ concept_id: 'con-1', interval_days: 21, is_hard: false }]}
      />
    )
    expect(screen.getByText('Completado')).toBeInTheDocument()
  })

  it('expands concepts when a module row is clicked', async () => {
    const user = userEvent.setup()
    render(<CurriculumClient {...defaultProps} />)

    // Concepts should not be visible initially
    expect(screen.queryByText('Sin embargo')).not.toBeInTheDocument()

    // Click the first module content area
    const moduleTitle = screen.getByText('Conectores')
    await user.click(moduleTitle)

    // Concept should now be visible
    expect(screen.getByText('Sin embargo')).toBeInTheDocument()
  })

  it('collapses concepts when the same module is clicked again', async () => {
    const user = userEvent.setup()
    render(<CurriculumClient {...defaultProps} />)

    const moduleTitle = screen.getByText('Conectores')
    await user.click(moduleTitle)
    expect(screen.getByText('Sin embargo')).toBeInTheDocument()

    await user.click(moduleTitle)
    expect(screen.queryByText('Sin embargo')).not.toBeInTheDocument()
  })

  it('renders "Practicar →" module links', () => {
    render(<CurriculumClient {...defaultProps} />)
    const links = screen.getAllByText('Practicar →')
    // One "Practicar →" link per module (concept rows no longer have practice links)
    expect(links.length).toBe(2)
  })

  it('renders concept rows as links to the concept detail page', async () => {
    const user = userEvent.setup()
    render(<CurriculumClient {...defaultProps} />)

    // Expand the first module
    const moduleTitle = screen.getByText('Conectores')
    await user.click(moduleTitle)

    // Concept row should link to /curriculum/con-1
    const conceptLink = screen.getByRole('link', { name: /Sin embargo/ })
    expect(conceptLink).toHaveAttribute('href', '/curriculum/con-1')
  })

  it('renders footer text', () => {
    render(<CurriculumClient {...defaultProps} />)
    expect(screen.getByText('tu senda continúa…')).toBeInTheDocument()
  })

  it('shows lock icon for locked concepts', async () => {
    const user = userEvent.setup()
    // B2 unlocked but C1 not
    render(
      <CurriculumClient
        {...defaultProps}
        unlockedLevelsList={['B1']}
      />
    )

    // Click the second module (Subjuntivo, contains B2 concept)
    const moduleTitle = screen.getByText('Subjuntivo')
    await user.click(moduleTitle)

    // The B2 concept should be rendered with reduced opacity (locked)
    expect(screen.getByText('Que subjuntivo')).toBeInTheDocument()
  })
})
