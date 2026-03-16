import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerbConfig } from '../VerbConfig'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('VerbConfig', () => {
  it('renders all tense group headings including Vocabulario', () => {
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)
    expect(screen.getByText('Indicativo')).toBeInTheDocument()
    expect(screen.getByText('Subjuntivo')).toBeInTheDocument()
    expect(screen.getByText('Imperativo')).toBeInTheDocument()
    expect(screen.getByText('Vocabulario')).toBeInTheDocument()
  })

  it('renders the Infinitivo tense chip', () => {
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)
    expect(screen.getByRole('button', { name: 'Infinitivo' })).toBeInTheDocument()
  })

  it('renders the Top 250 verb set option', () => {
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)
    expect(screen.getByText('Top 250')).toBeInTheDocument()
  })

  it('disables hint toggle when only infinitive is selected', async () => {
    const user = userEvent.setup()
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)

    // Deselect the default (present_indicative), select infinitive
    await user.click(screen.getByRole('button', { name: 'Infinitivo' }))
    await user.click(screen.getByRole('button', { name: 'Presente de Indicativo' }))

    const checkbox = screen.getByRole('checkbox', { name: /Mostrar pista/ })
    expect(checkbox).toBeDisabled()
  })

  it('enables hint toggle when infinitive is mixed with other tenses', async () => {
    const user = userEvent.setup()
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)

    // Select infinitive in addition to default present_indicative
    await user.click(screen.getByRole('button', { name: 'Infinitivo' }))

    const checkbox = screen.getByRole('checkbox', { name: /Mostrar pista/ })
    expect(checkbox).not.toBeDisabled()
  })

  it('renders all verb set options (top25, top50, top100, top250)', () => {
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)
    expect(screen.getByText('Top 25')).toBeInTheDocument()
    expect(screen.getByText('Top 50')).toBeInTheDocument()
    expect(screen.getByText('Top 100')).toBeInTheDocument()
    expect(screen.getByText('Top 250')).toBeInTheDocument()
  })

  it('shows Mis Favoritos when favoriteCount > 0', () => {
    render(<VerbConfig favoriteCount={5} singleVerb={null} />)
    expect(screen.getByText('Mis Favoritos (5)')).toBeInTheDocument()
  })

  it('hides Mis Favoritos when favoriteCount is 0', () => {
    render(<VerbConfig favoriteCount={0} singleVerb={null} />)
    expect(screen.queryByText(/Mis Favoritos/)).not.toBeInTheDocument()
  })
})
