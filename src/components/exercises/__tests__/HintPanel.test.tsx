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
    expect(screen.getByText('Pistas:')).toBeTruthy()
    expect(screen.queryByText('Think about connectors.')).toBeNull()
  })

  it('renders two dots when hint1 and hint2 both exist', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1="Hint one." hint2="Hint two." />
    )
    const dots = container.querySelectorAll('.rounded-full.h-2.w-2')
    expect(dots.length).toBe(2)
  })

  it('dot1 turns warm when wrongAttempts >= 1', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1="Hint one." wrongAttempts={1} />
    )
    const dots = container.querySelectorAll('.rounded-full.h-2.w-2')
    expect(dots[0].className).toContain('bg-[var(--d5-warm)]')
  })

  it('dot2 turns warm when wrongAttempts >= 2', () => {
    const { container } = render(
      <HintPanel {...defaultProps} hint1="Hint one." hint2="Hint two." wrongAttempts={2} />
    )
    const dots = container.querySelectorAll('.rounded-full.h-2.w-2')
    expect(dots[1].className).toContain('bg-[var(--d5-warm)]')
  })

  it('hint text is only shown after wrong attempts', () => {
    const { rerender } = render(
      <HintPanel {...defaultProps} hint1="Think about this." wrongAttempts={0} />
    )
    expect(screen.queryByText('Think about this.')).toBeNull()

    rerender(
      <HintPanel {...defaultProps} hint1="Think about this." wrongAttempts={1} />
    )
    expect(screen.getByText(/Think about this\./)).toBeTruthy()
  })
})
