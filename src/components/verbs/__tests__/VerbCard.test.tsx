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
  masteryDots: [
    { tense: 'presente', pct: 80 },
    { tense: 'preterito', pct: 40 },
    { tense: 'imperfecto', pct: 0 },
  ],
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

  it('uses bg-primary for mastered dots (>=70%)', () => {
    render(<VerbCard {...makeProps()} />)
    const dots = document.querySelectorAll('.bg-primary')
    expect(dots.length).toBe(1) // 80% dot
  })

  it('uses bg-amber-400 for in-progress dots (>0% <70%)', () => {
    render(<VerbCard {...makeProps()} />)
    const dots = document.querySelectorAll('.bg-amber-400')
    expect(dots.length).toBe(1) // 40% dot
  })

  it('passes style prop to link', () => {
    render(<VerbCard {...makeProps()} style={{ animationDelay: '90ms' }} />)
    const link = screen.getByRole('link')
    expect(link.style.animationDelay).toBe('90ms')
  })
})
