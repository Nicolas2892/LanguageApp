import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VocabRow } from '../VocabRow'

describe('VocabRow', () => {
  const baseProps = {
    expression: 'dar un paseo',
    english: 'to take a walk',
    category: 'fixed_phrases',
    masteryState: 'none' as const,
    isLast: false,
  }

  it('renders expression and english translation', () => {
    render(<VocabRow {...baseProps} />)
    expect(screen.getByText('dar un paseo')).toBeInTheDocument()
    expect(screen.getByText(/to take a walk/)).toBeInTheDocument()
  })

  it('renders category chip', () => {
    render(<VocabRow {...baseProps} />)
    expect(screen.getByText('Fijas')).toBeInTheDocument()
  })

  it('shows terracotta mastery dot when mastered', () => {
    render(<VocabRow {...baseProps} masteryState="mastered" />)
    const dot = screen.getByTitle('Dominado')
    expect(dot).toHaveClass('bg-primary')
  })

  it('shows amber mastery dot when in_progress', () => {
    render(<VocabRow {...baseProps} masteryState="in_progress" />)
    const dot = screen.getByTitle('En progreso')
    expect(dot).toHaveClass('bg-amber-400')
  })

  it('shows transparent dot when no mastery', () => {
    render(<VocabRow {...baseProps} masteryState="none" />)
    // No title when none
    expect(screen.queryByTitle('Dominado')).not.toBeInTheDocument()
    expect(screen.queryByTitle('En progreso')).not.toBeInTheDocument()
  })

  it('renders bottom border when not last', () => {
    const { container } = render(<VocabRow {...baseProps} isLast={false} />)
    const row = container.firstChild as HTMLElement
    expect(row.style.borderBottom).toBe('1px solid var(--d5-divider)')
  })

  it('omits bottom border when last', () => {
    const { container } = render(<VocabRow {...baseProps} isLast={true} />)
    const row = container.firstChild as HTMLElement
    expect(row.style.borderBottom).toBe('')
  })
})
