import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CircularProgress } from '../CircularProgress'

describe('CircularProgress', () => {
  it('renders an SVG with two circles', () => {
    const { container } = render(<CircularProgress progress={50} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
  })

  it('shows 0% as full dashoffset (empty ring)', () => {
    const { container } = render(<CircularProgress progress={0} size={20} strokeWidth={2.5} />)
    const circles = container.querySelectorAll('circle')
    const foreground = circles[1]
    const r = (20 - 2.5) / 2 // 8.75
    const circumference = 2 * Math.PI * r
    expect(foreground.style.strokeDashoffset).toBe(`${circumference}`)
  })

  it('shows 100% as zero dashoffset (full ring)', () => {
    const { container } = render(<CircularProgress progress={100} size={20} strokeWidth={2.5} />)
    const circles = container.querySelectorAll('circle')
    const foreground = circles[1]
    expect(foreground.style.strokeDashoffset).toBe('0')
  })

  it('shows 50% as half dashoffset', () => {
    const { container } = render(<CircularProgress progress={50} size={20} strokeWidth={2.5} />)
    const circles = container.querySelectorAll('circle')
    const foreground = circles[1]
    const r = (20 - 2.5) / 2
    const circumference = 2 * Math.PI * r
    const expected = circumference * (1 - 50 / 100)
    expect(foreground.style.strokeDashoffset).toBe(`${expected}`)
  })

  it('respects custom size prop', () => {
    const { container } = render(<CircularProgress progress={50} size={32} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('has CSS transition on foreground circle', () => {
    const { container } = render(<CircularProgress progress={50} />)
    const foreground = container.querySelectorAll('circle')[1]
    expect(foreground.style.transition).toContain('stroke-dashoffset')
  })
})
