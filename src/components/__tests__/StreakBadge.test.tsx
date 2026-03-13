import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreakBadge } from '../StreakBadge'

describe('StreakBadge', () => {
  it('renders the streak number', () => {
    render(<StreakBadge streak={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('uses terracotta color when streak > 0', () => {
    const { container } = render(<StreakBadge streak={3} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('fill')).toBe('var(--d5-terracotta)')
  })

  it('uses muted color when streak is 0', () => {
    const { container } = render(<StreakBadge streak={0} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('fill')).toBe('var(--d5-muted)')
  })

  it('renders "días" label at md size', () => {
    render(<StreakBadge streak={5} size="md" />)
    expect(screen.getByText('días')).toBeInTheDocument()
  })

  it('renders "día" label (singular) at md size when streak is 1', () => {
    render(<StreakBadge streak={1} size="md" />)
    expect(screen.getByText('día')).toBeInTheDocument()
  })

  it('does not render day label at sm size', () => {
    render(<StreakBadge streak={5} size="sm" />)
    expect(screen.queryByText('días')).not.toBeInTheDocument()
  })
})
