import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SplashScreen } from '../SplashScreen'

beforeEach(() => {
  vi.useFakeTimers()
  // Default: no reduced motion
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SplashScreen', () => {
  it('renders splash with branding text', () => {
    render(<SplashScreen />)
    expect(screen.getByText('Senda')).toBeInTheDocument()
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument()
  })

  it('unmounts after animation completes (1700ms)', () => {
    render(<SplashScreen />)
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument()

    // At 1200ms, starts fading
    act(() => { vi.advanceTimersByTime(1200) })
    expect(screen.getByTestId('splash-screen')).toHaveClass('splash-fade-out')

    // At 1700ms, fully unmounted
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument()
  })

  it('unmounts faster with prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    render(<SplashScreen />)
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument()

    // Reduced motion: fade at 600ms, done at 1100ms
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.getByTestId('splash-screen')).toHaveClass('splash-fade-out')

    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument()
  })

  it('renders the S-trail SVG path', () => {
    render(<SplashScreen />)
    const trailPath = screen.getByTestId('splash-screen').querySelector('.splash-trail-draw')
    expect(trailPath).toBeInTheDocument()
    expect(trailPath?.tagName).toBe('path')
  })

  it('renders the logo with splash-logo-in animation class', () => {
    render(<SplashScreen />)
    const logoGroup = screen.getByTestId('splash-screen').querySelector('.splash-logo-in')
    expect(logoGroup).toBeInTheDocument()
  })

  it('uses adaptive background token (works in dark mode)', () => {
    render(<SplashScreen />)
    const container = screen.getByTestId('splash-screen')
    // var(--background) auto-swaps: paper in light, ink in dark
    expect(container.style.background).toBe('var(--background)')
  })

  it('disables pointer-events during fade-out', () => {
    render(<SplashScreen />)
    const container = screen.getByTestId('splash-screen')
    expect(container.style.pointerEvents).toBe('')

    act(() => { vi.advanceTimersByTime(1200) })
    expect(container.style.pointerEvents).toBe('none')
  })
})
