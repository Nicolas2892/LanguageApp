import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerbRow } from '../VerbRow'

// Mock VerbFavoriteButton — it uses client-side fetch
vi.mock('../VerbFavoriteButton', () => ({
  VerbFavoriteButton: ({ verbId }: { verbId: string }) => (
    <button data-testid={`fav-${verbId}`}>fav</button>
  ),
}))

const makeProps = (overrides: Partial<Parameters<typeof VerbRow>[0]> = {}) => ({
  id: '123',
  infinitive: 'hablar',
  english: 'to speak',
  verbGroup: 'ar',
  favorited: false,
  masteryState: 'none' as const,
  ...overrides,
})

describe('VerbRow', () => {
  it('renders infinitive and english', () => {
    render(<VerbRow {...makeProps()} />)
    expect(screen.getByText('hablar')).toBeInTheDocument()
    expect(screen.getByText(/to speak/)).toBeInTheDocument()
  })

  it('links to verb detail page', () => {
    render(<VerbRow {...makeProps()} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/verbs/hablar')
  })

  it('renders VerbGroupChip', () => {
    render(<VerbRow {...makeProps({ verbGroup: 'ar' })} />)
    expect(screen.getByText('-ar')).toBeInTheDocument()
  })

  it('renders irregular group chip', () => {
    render(<VerbRow {...makeProps({ verbGroup: 'irregular' })} />)
    expect(screen.getByText('irreg.')).toBeInTheDocument()
  })

  it('shows primary dot when mastered', () => {
    render(<VerbRow {...makeProps({ masteryState: 'mastered' })} />)
    const dot = document.querySelector('.bg-primary')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('title', 'Dominado')
  })

  it('shows amber dot when in progress', () => {
    render(<VerbRow {...makeProps({ masteryState: 'in_progress' })} />)
    const dot = document.querySelector('.bg-amber-400')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('title', 'En progreso')
  })

  it('shows transparent dot when mastery state is none (for alignment)', () => {
    render(<VerbRow {...makeProps({ masteryState: 'none' })} />)
    expect(document.querySelector('.bg-primary')).not.toBeInTheDocument()
    expect(document.querySelector('.bg-amber-400')).not.toBeInTheDocument()
  })

  it('passes style prop for animation delay', () => {
    const { container } = render(<VerbRow {...makeProps()} style={{ animationDelay: '60ms' }} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.animationDelay).toBe('60ms')
  })

  it('renders bottom border when not last', () => {
    const { container } = render(<VerbRow {...makeProps()} isLast={false} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderBottom).toBe('1px solid var(--d5-divider)')
  })

  it('does not render bottom border when last', () => {
    const { container } = render(<VerbRow {...makeProps()} isLast={true} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.borderBottom).toBe('')
  })
})
