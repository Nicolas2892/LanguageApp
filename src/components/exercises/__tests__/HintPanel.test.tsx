import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HintPanel } from '../HintPanel'

const defaultProps = {
  hint1: null,
  hint2: null,
  claudeHint: null,
  wrongAttempts: 0,
  loadingHint: false,
  onRequestHint: vi.fn(),
}

describe('HintPanel', () => {
  it('returns null when neither hint1 nor hint2 provided', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1={null} hint2={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders dots row when wrongAttempts=0 and hint1 exists', () => {
    render(<HintPanel {...defaultProps} hint1="Think about connectors." />)
    // Dots row is rendered — look for the "Hints:" label
    expect(screen.getByText('Hints:')).toBeTruthy()
    // Hint text itself is NOT shown yet
    expect(screen.queryByText('Think about connectors.')).toBeNull()
  })

  it('renders two dots when hint1 and hint2 both exist', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1="Hint one." hint2="Hint two." />
    )
    // Both dots are rendered (grey border class when not revealed)
    const dots = container.querySelectorAll('.rounded-full.h-2.w-2')
    expect(dots.length).toBe(2)
  })

  it('dot1 turns amber when wrongAttempts >= 1', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1="Hint one." wrongAttempts={1} />
    )
    const dots = container.querySelectorAll('.rounded-full.h-2.w-2')
    expect(dots[0].className).toContain('bg-amber-400')
  })

  it('dot2 turns amber when wrongAttempts >= 2', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1="Hint one." hint2="Hint two." wrongAttempts={2} />
    )
    const dots = container.querySelectorAll('.rounded-full.h-2.w-2')
    expect(dots[1].className).toContain('bg-amber-400')
  })

  it('hint text is only shown after wrong attempts', () => {
    // Before: hint text hidden
    const { rerender } = render(
      <HintPanel {...defaultProps} hint1="Think about this." wrongAttempts={0} />
    )
    expect(screen.queryByText('Think about this.')).toBeNull()

    // After first wrong attempt: hint text shown
    rerender(
      <HintPanel {...defaultProps} hint1="Think about this." wrongAttempts={1} />
    )
    expect(screen.getByText(/Think about this\./)).toBeTruthy()
  })
})
