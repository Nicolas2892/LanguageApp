import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// Mock the storage module used by SplashScreen
const mockStore: Record<string, string> = {}
vi.mock('@/lib/platform/storage', () => ({
  storage: {
    get: vi.fn((key: string) => mockStore[key] ?? null),
    set: vi.fn((key: string, value: string) => { mockStore[key] = value }),
    remove: vi.fn((key: string) => { delete mockStore[key] }),
    getSession: vi.fn(() => null),
    setSession: vi.fn(),
    removeSession: vi.fn(),
  },
}))

import { SplashScreen } from '../SplashScreen'
import { storage } from '@/lib/platform/storage'

beforeEach(() => {
  vi.useFakeTimers()
  // Clear mock store
  Object.keys(mockStore).forEach(k => delete mockStore[k])
  vi.mocked(storage.get).mockImplementation((key: string) => mockStore[key] ?? null)
  vi.mocked(storage.set).mockImplementation((key: string, value: string) => { mockStore[key] = value })
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

  it('unmounts after animation completes (2200ms)', () => {
    render(<SplashScreen />)
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument()

    // At 1600ms, starts fading
    act(() => { vi.advanceTimersByTime(1600) })
    expect(screen.getByTestId('splash-screen')).toHaveClass('splash-fade-out')

    // At 2200ms, fully unmounted
    act(() => { vi.advanceTimersByTime(600) })
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

  it('renders the S-trail SVG', () => {
    render(<SplashScreen />)
    const trail = screen.getByTestId('splash-screen').querySelector('.splash-trail-draw')
    expect(trail).toBeInTheDocument()
    expect(trail?.tagName).toBe('svg')
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

    act(() => { vi.advanceTimersByTime(1600) })
    expect(container.style.pointerEvents).toBe('none')
  })

  it('skips splash when localStorage flag is already set', () => {
    mockStore['senda-splash-v2'] = '1'
    render(<SplashScreen />)
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument()
  })

  it('sets localStorage flag on first render', () => {
    render(<SplashScreen />)
    expect(storage.set).toHaveBeenCalledWith('senda-splash-v2', '1')
  })

  it('still shows splash when storage returns null (e.g. blocked storage)', () => {
    // storage.get/set already catch internally — when storage is blocked they return null / no-op
    vi.mocked(storage.get).mockReturnValue(null)
    vi.mocked(storage.set).mockImplementation(() => { /* no-op */ })

    render(<SplashScreen />)
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument()
  })
})
