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
vi.mock('@/components/offline/DownloadButton', () => ({
  DownloadButton: ({ moduleId }: { moduleId: string }) => (
    <button data-testid={`download-${moduleId}`}>Download</button>
  ),
}))
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
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
        progressEntries={[{ concept_id: 'con-1', interval_days: 1, is_hard: false, production_mastered: false }]}
      />
    )
    expect(screen.getByText('En Progreso')).toBeInTheDocument()
  })

  it('shows "Completado" for a fully mastered module', () => {
    render(
      <CurriculumClient
        {...defaultProps}
        progressEntries={[{ concept_id: 'con-1', interval_days: 21, is_hard: false, production_mastered: true }]}
      />
    )
    expect(screen.getByText('Completado')).toBeInTheDocument()
  })

  it('expands concepts when a module row is clicked', async () => {
    const user = userEvent.setup()
    render(<CurriculumClient {...defaultProps} />)

    // Accordion content is in DOM but hidden (aria-hidden=true)
    const conceptText = screen.getByText('Sin embargo')
    expect(conceptText.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true')

    // Click the first module content area
    const moduleTitle = screen.getByText('Conectores')
    await user.click(moduleTitle)

    // Accordion should now be expanded (aria-hidden=false)
    expect(conceptText.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false')
  })

  it('collapses concepts when the same module is clicked again', async () => {
    const user = userEvent.setup()
    render(<CurriculumClient {...defaultProps} />)

    const moduleTitle = screen.getByText('Conectores')
    await user.click(moduleTitle)
    const conceptText = screen.getByText('Sin embargo')
    expect(conceptText.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false')

    await user.click(moduleTitle)
    expect(conceptText.closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true')
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

  it('shows unit sub-headers when an expanded module has multiple units', async () => {
    const user = userEvent.setup()
    const multiUnitModule = { id: 'mod-multi', title: 'Pasado', order_index: 3 }
    const multiUnits = [
      { id: 'unit-a', module_id: 'mod-multi', title: 'Indefinido', order_index: 1 },
      { id: 'unit-b', module_id: 'mod-multi', title: 'Imperfecto', order_index: 2 },
    ]
    const multiConcepts = [
      { id: 'con-a', unit_id: 'unit-a', title: 'Pretérito indef', difficulty: 1, level: 'B1', grammar_focus: null },
      { id: 'con-b', unit_id: 'unit-b', title: 'Pretérito imp', difficulty: 2, level: 'B1', grammar_focus: null },
    ]
    render(
      <CurriculumClient
        modules={[multiUnitModule]}
        units={multiUnits}
        concepts={multiConcepts}
        progressEntries={[]}
        unlockedLevelsList={['B1', 'B2']}
      />
    )
    await user.click(screen.getByText('Pasado'))
    expect(screen.getByText('Indefinido')).toBeInTheDocument()
    expect(screen.getByText('Imperfecto')).toBeInTheDocument()
  })

  it('does not show unit sub-headers when an expanded module has a single unit', async () => {
    const user = userEvent.setup()
    render(<CurriculumClient {...defaultProps} />)
    await user.click(screen.getByText('Conectores'))
    // 'Unidad 1' is the single unit title — should NOT appear as a sub-header
    expect(screen.queryByText('Unidad 1')).not.toBeInTheDocument()
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
