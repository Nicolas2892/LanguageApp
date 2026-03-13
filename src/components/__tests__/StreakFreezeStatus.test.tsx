import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreakFreezeStatus } from '../StreakFreezeStatus'

describe('StreakFreezeStatus', () => {
  it('shows "Protección activa" when freeze available and streak > 0', () => {
    render(<StreakFreezeStatus streak={5} freezeRemaining={1} />)
    expect(screen.getByText('Protección activa')).toBeInTheDocument()
  })

  it('shows "Protección usada" when freeze is 0 and streak > 0', () => {
    render(<StreakFreezeStatus streak={5} freezeRemaining={0} />)
    expect(screen.getByText('Protección usada')).toBeInTheDocument()
  })

  it('does not render when streak is 0', () => {
    const { container } = render(<StreakFreezeStatus streak={0} freezeRemaining={1} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders shield SVG icon', () => {
    const { container } = render(<StreakFreezeStatus streak={3} freezeRemaining={1} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
