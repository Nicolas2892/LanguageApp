import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../ThemeProvider'

// Helper component to expose useTheme values
function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('light')}>set light</button>
      <button onClick={() => setTheme('dark')}>set dark</button>
      <button onClick={() => setTheme('system')}>set system</button>
    </div>
  )
}

// MediaQueryList mock factory
function makeMqMock(matches: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = []
  return {
    matches,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
      listeners.push(fn)
    },
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
      const idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    },
    _trigger: (m: boolean) => listeners.forEach((fn) => fn({ matches: m })),
  }
}

describe('ThemeProvider', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('applies dark class when initialTheme is dark', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <div />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when initialTheme is light', () => {
    document.documentElement.classList.add('dark')
    render(
      <ThemeProvider initialTheme="light">
        <div />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applies dark class for system when OS is dark', () => {
    const mq = makeMqMock(true)
    window.matchMedia = vi.fn().mockReturnValue(mq as unknown as MediaQueryList)
    render(
      <ThemeProvider initialTheme="system">
        <div />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not apply dark class for system when OS is light', () => {
    const mq = makeMqMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mq as unknown as MediaQueryList)
    render(
      <ThemeProvider initialTheme="system">
        <div />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('responds to OS media query change when initialTheme is system', async () => {
    const mq = makeMqMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mq as unknown as MediaQueryList)
    render(
      <ThemeProvider initialTheme="system">
        <div />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    act(() => mq._trigger(true))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    act(() => mq._trigger(false))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme updates the class immediately', async () => {
    window.matchMedia = vi.fn().mockReturnValue(makeMqMock(false) as unknown as MediaQueryList)
    render(
      <ThemeProvider initialTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await userEvent.click(screen.getByText('set dark'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await userEvent.click(screen.getByText('set light'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('useTheme throws when used outside ThemeProvider', () => {
    // Suppress React error boundary noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within a ThemeProvider')
    spy.mockRestore()
  })
})
