import { describe, it, expect, vi } from 'vitest'
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

  it('renders shield icon when freezeAvailable={true} and streak > 0', () => {
    render(<StreakBadge streak={5} freezeAvailable={true} />)
    expect(screen.getByLabelText('Protección disponible')).toBeInTheDocument()
  })

  it('does not render shield when freezeAvailable={false}', () => {
    render(<StreakBadge streak={5} freezeAvailable={false} />)
    expect(screen.queryByLabelText('Protección disponible')).not.toBeInTheDocument()
  })

  it('does not render shield when streak is 0', () => {
    render(<StreakBadge streak={0} freezeAvailable={true} />)
    expect(screen.queryByLabelText('Protección disponible')).not.toBeInTheDocument()
  })

  it('renders as button when onClick is provided', () => {
    const onClick = vi.fn()
    render(<StreakBadge streak={5} onClick={onClick} />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    button.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders as div when onClick is not provided', () => {
    render(<StreakBadge streak={5} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
