import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerbCard } from '../VerbCard'

// Mock VerbFavoriteButton — it uses client-side fetch
vi.mock('../VerbFavoriteButton', () => ({
  VerbFavoriteButton: ({ verbId }: { verbId: string }) => (
    <button data-testid={`fav-${verbId}`}>fav</button>
  ),
}))

const makeProps = (overrides: Partial<Parameters<typeof VerbCard>[0]> = {}) => ({
  id: '123',
  infinitive: 'hablar',
  english: 'to speak',
  verbGroup: 'ar',
  favorited: false,
  masteryState: 'none' as const,
  ...overrides,
})

describe('VerbCard', () => {
  it('renders infinitive and english', () => {
    render(<VerbCard {...makeProps()} />)
    expect(screen.getByText('hablar')).toBeInTheDocument()
    expect(screen.getByText('to speak')).toBeInTheDocument()
  })

  it('links to verb detail page', () => {
    render(<VerbCard {...makeProps()} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/verbs/hablar')
  })

  it('renders VerbGroupChip instead of plain badge', () => {
    render(<VerbCard {...makeProps({ verbGroup: 'ar' })} />)
    expect(screen.getByText('-ar')).toBeInTheDocument()
  })

  it('renders irregular group chip', () => {
    render(<VerbCard {...makeProps({ verbGroup: 'irregular' })} />)
    expect(screen.getByText('irreg.')).toBeInTheDocument()
  })

  it('uses senda-card class', () => {
    render(<VerbCard {...makeProps()} />)
    const link = screen.getByRole('link')
    expect(link.className).toContain('senda-card')
  })

  it('shows primary dot when mastered', () => {
    render(<VerbCard {...makeProps({ masteryState: 'mastered' })} />)
    const dot = document.querySelector('.bg-primary')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('title', 'Dominado')
  })

  it('shows amber dot when in progress', () => {
    render(<VerbCard {...makeProps({ masteryState: 'in_progress' })} />)
    const dot = document.querySelector('.bg-amber-400')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute('title', 'En progreso')
  })

  it('shows no dot when mastery state is none', () => {
    render(<VerbCard {...makeProps({ masteryState: 'none' })} />)
    expect(document.querySelector('.bg-primary')).not.toBeInTheDocument()
    expect(document.querySelector('.bg-amber-400')).not.toBeInTheDocument()
  })

  it('passes style prop to link', () => {
    render(<VerbCard {...makeProps()} style={{ animationDelay: '90ms' }} />)
    const link = screen.getByRole('link')
    expect(link.style.animationDelay).toBe('90ms')
  })
})
