import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VocabDirectory } from '../VocabDirectory'

// Mock VocabRow to inspect props
vi.mock('@/components/vocab/VocabRow', () => ({
  VocabRow: ({ expression, category, masteryState, style }: { expression: string; category: string; masteryState: string; style?: React.CSSProperties }) => (
    <div data-testid={`row-${expression}`} data-category={category} data-mastery={masteryState} style={style}>
      {expression}
    </div>
  ),
}))

const makeItems = () => [
  { expression: 'a fin de cuentas', english: 'in the end', category: 'discourse_markers', masteryState: 'mastered' as const },
  { expression: 'dar un paseo', english: 'to take a walk', category: 'fixed_phrases', masteryState: 'in_progress' as const },
  { expression: 'echar de menos', english: 'to miss', category: 'idiomatic', masteryState: 'none' as const },
  { expression: 'en cambio', english: 'on the other hand', category: 'discourse_markers', masteryState: 'none' as const },
]

describe('VocabDirectory', () => {
  it('renders all items by default', () => {
    render(<VocabDirectory items={makeItems()} />)
    expect(screen.getByTestId('row-a fin de cuentas')).toBeInTheDocument()
    expect(screen.getByTestId('row-dar un paseo')).toBeInTheDocument()
    expect(screen.getByTestId('row-echar de menos')).toBeInTheDocument()
    expect(screen.getByTestId('row-en cambio')).toBeInTheDocument()
  })

  it('groups items by first letter with senda-eyebrow headers', () => {
    render(<VocabDirectory items={makeItems()} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('filters by search query (expression)', async () => {
    const user = userEvent.setup()
    render(<VocabDirectory items={makeItems()} />)
    await user.type(screen.getByPlaceholderText('Buscar Vocabulario...'), 'dar')
    expect(screen.getByTestId('row-dar un paseo')).toBeInTheDocument()
    expect(screen.queryByTestId('row-a fin de cuentas')).not.toBeInTheDocument()
  })

  it('filters by search query (english)', async () => {
    const user = userEvent.setup()
    render(<VocabDirectory items={makeItems()} />)
    await user.type(screen.getByPlaceholderText('Buscar Vocabulario...'), 'miss')
    expect(screen.getByTestId('row-echar de menos')).toBeInTheDocument()
    expect(screen.queryByTestId('row-dar un paseo')).not.toBeInTheDocument()
  })

  it('filters by category chip', async () => {
    const user = userEvent.setup()
    render(<VocabDirectory items={makeItems()} />)
    await user.click(screen.getByText('Discurso'))
    expect(screen.getByTestId('row-a fin de cuentas')).toBeInTheDocument()
    expect(screen.getByTestId('row-en cambio')).toBeInTheDocument()
    expect(screen.queryByTestId('row-dar un paseo')).not.toBeInTheDocument()
  })

  it('toggles category filter off when clicking same chip', async () => {
    const user = userEvent.setup()
    render(<VocabDirectory items={makeItems()} />)
    await user.click(screen.getByText('Discurso'))
    expect(screen.queryByTestId('row-dar un paseo')).not.toBeInTheDocument()
    await user.click(screen.getByText('Discurso'))
    expect(screen.getByTestId('row-dar un paseo')).toBeInTheDocument()
  })

  it('shows empty state when no matches', async () => {
    const user = userEvent.setup()
    render(<VocabDirectory items={makeItems()} />)
    await user.type(screen.getByPlaceholderText('Buscar Vocabulario...'), 'zzzzz')
    expect(screen.getByText('No se encontraron expresiones.')).toBeInTheDocument()
    expect(screen.getByText('¡Prueba con otra búsqueda!')).toBeInTheDocument()
  })

  it('renders Todos chip and all category chips', () => {
    render(<VocabDirectory items={makeItems()} />)
    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText('Discurso')).toBeInTheDocument()
    expect(screen.getByText('Fijas')).toBeInTheDocument()
    expect(screen.getByText('Coloc.')).toBeInTheDocument()
    expect(screen.getByText('Formal')).toBeInTheDocument()
    expect(screen.getByText('Idiom.')).toBeInTheDocument()
    expect(screen.getByText('Prep.')).toBeInTheDocument()
    expect(screen.getByText('Adverb.')).toBeInTheDocument()
    expect(screen.getByText('Pragm.')).toBeInTheDocument()
  })

  it('applies staggered animation delay to rows', () => {
    render(<VocabDirectory items={makeItems()} />)
    const first = screen.getByTestId('row-a fin de cuentas')
    expect(first.style.animationDelay).toBe('0ms')
  })

  it('combines category filter with search', async () => {
    const user = userEvent.setup()
    render(<VocabDirectory items={makeItems()} />)
    await user.click(screen.getByText('Discurso'))
    await user.type(screen.getByPlaceholderText('Buscar Vocabulario...'), 'cambio')
    expect(screen.getByTestId('row-en cambio')).toBeInTheDocument()
    expect(screen.queryByTestId('row-a fin de cuentas')).not.toBeInTheDocument()
  })
})
