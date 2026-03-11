import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbDirectory } from '../VerbDirectory'

// Mock VerbCard to inspect props
vi.mock('@/components/verbs/VerbCard', () => ({
  VerbCard: ({ infinitive, verbGroup, favorited, style }: { infinitive: string; verbGroup: string; favorited: boolean; style?: React.CSSProperties }) => (
    <div data-testid={`card-${infinitive}`} data-group={verbGroup} data-fav={String(favorited)} style={style}>
      {infinitive}
    </div>
  ),
}))

const makeVerbs = () => [
  { id: '1', infinitive: 'hablar', english: 'to speak', verb_group: 'ar', favorited: true, masteryByTense: {} },
  { id: '2', infinitive: 'hacer', english: 'to do', verb_group: 'irregular', favorited: false, masteryByTense: {} },
  { id: '3', infinitive: 'comer', english: 'to eat', verb_group: 'er', favorited: false, masteryByTense: {} },
  { id: '4', infinitive: 'vivir', english: 'to live', verb_group: 'ir', favorited: true, masteryByTense: {} },
]

describe('VerbDirectory', () => {
  it('renders all verbs by default', () => {
    render(<VerbDirectory verbs={makeVerbs()} />)
    expect(screen.getByTestId('card-hablar')).toBeInTheDocument()
    expect(screen.getByTestId('card-hacer')).toBeInTheDocument()
    expect(screen.getByTestId('card-comer')).toBeInTheDocument()
    expect(screen.getByTestId('card-vivir')).toBeInTheDocument()
  })

  it('groups verbs by first letter with senda-eyebrow headers', () => {
    render(<VerbDirectory verbs={makeVerbs()} />)
    // C for comer, H for hablar+hacer, V for vivir
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('filters by search query (infinitive)', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.type(screen.getByPlaceholderText('Buscar verbos...'), 'hab')
    expect(screen.getByTestId('card-hablar')).toBeInTheDocument()
    expect(screen.queryByTestId('card-comer')).not.toBeInTheDocument()
  })

  it('filters by search query (english)', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.type(screen.getByPlaceholderText('Buscar verbos...'), 'eat')
    expect(screen.getByTestId('card-comer')).toBeInTheDocument()
    expect(screen.queryByTestId('card-hablar')).not.toBeInTheDocument()
  })

  it('filters by -AR group', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.click(screen.getByText('-AR'))
    expect(screen.getByTestId('card-hablar')).toBeInTheDocument()
    expect(screen.queryByTestId('card-comer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('card-hacer')).not.toBeInTheDocument()
  })

  it('filters by Irregulares group', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.click(screen.getByText('Irregulares'))
    expect(screen.getByTestId('card-hacer')).toBeInTheDocument()
    expect(screen.queryByTestId('card-hablar')).not.toBeInTheDocument()
  })

  it('toggles group filter off when clicking same chip', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.click(screen.getByText('-AR'))
    expect(screen.queryByTestId('card-comer')).not.toBeInTheDocument()
    // Click again to deselect
    await user.click(screen.getByText('-AR'))
    expect(screen.getByTestId('card-comer')).toBeInTheDocument()
  })

  it('filters by Favoritos', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.click(screen.getByText('Favoritos'))
    expect(screen.getByTestId('card-hablar')).toBeInTheDocument()
    expect(screen.getByTestId('card-vivir')).toBeInTheDocument()
    expect(screen.queryByTestId('card-comer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('card-hacer')).not.toBeInTheDocument()
  })

  it('combines group filter with Favoritos', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.click(screen.getByText('-AR'))
    await user.click(screen.getByText('Favoritos'))
    expect(screen.getByTestId('card-hablar')).toBeInTheDocument()
    expect(screen.queryByTestId('card-vivir')).not.toBeInTheDocument()
  })

  it('shows empty state in Spanish when no matches', async () => {
    const user = userEvent.setup()
    render(<VerbDirectory verbs={makeVerbs()} />)
    await user.type(screen.getByPlaceholderText('Buscar verbos...'), 'zzzzz')
    expect(screen.getByText('No se encontraron verbos.')).toBeInTheDocument()
    expect(screen.getByText('¡Prueba con otra búsqueda!')).toBeInTheDocument()
  })

  it('renders all filter chips', () => {
    render(<VerbDirectory verbs={makeVerbs()} />)
    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText('-AR')).toBeInTheDocument()
    expect(screen.getByText('-ER')).toBeInTheDocument()
    expect(screen.getByText('-IR')).toBeInTheDocument()
    expect(screen.getByText('Irregulares')).toBeInTheDocument()
    expect(screen.getByText('Favoritos')).toBeInTheDocument()
  })

  it('applies staggered animation delay to cards', () => {
    render(<VerbDirectory verbs={makeVerbs()} />)
    const hablar = screen.getByTestId('card-hablar')
    const hacer = screen.getByTestId('card-hacer')
    // hablar is first in H group (index 0)
    expect(hablar.style.animationDelay).toBe('0ms')
    // hacer is second in H group (index 1)
    expect(hacer.style.animationDelay).toBe('30ms')
  })
})
