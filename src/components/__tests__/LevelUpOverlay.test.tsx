import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LevelUpOverlay } from '../LevelUpOverlay'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    <button {...props}>{children}</button>,
}))

const mockStorage = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size },
  key: (_i: number) => null as string | null,
}

describe('LevelUpOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStorage.clear()
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not show overlay when there is no stored level', () => {
    render(<LevelUpOverlay currentLevel="B1" />)
    expect(screen.queryByText(/Subiste a/)).not.toBeInTheDocument()
  })

  it('shows overlay when level increases from B1 to B2', () => {
    mockLocalStorage.setItem('last_known_level', 'B1')
    render(<LevelUpOverlay currentLevel="B2" />)
    expect(screen.getByText('¡Subiste a B2!')).toBeInTheDocument()
  })

  it('shows overlay when level increases from B2 to C1', () => {
    mockLocalStorage.setItem('last_known_level', 'B2')
    render(<LevelUpOverlay currentLevel="C1" />)
    expect(screen.getByText('¡Subiste a C1!')).toBeInTheDocument()
  })

  it('does not show overlay when level stays same', () => {
    mockLocalStorage.setItem('last_known_level', 'B2')
    render(<LevelUpOverlay currentLevel="B2" />)
    expect(screen.queryByText(/Subiste a/)).not.toBeInTheDocument()
  })

  it('saves current level to localStorage on mount', () => {
    mockLocalStorage.setItem('last_known_level', 'B1')
    render(<LevelUpOverlay currentLevel="B2" />)
    expect(mockLocalStorage.getItem('last_known_level')).toBe('B2')
  })

  it('auto-dismisses after 6 seconds', () => {
    mockLocalStorage.setItem('last_known_level', 'B1')
    render(<LevelUpOverlay currentLevel="B2" />)
    expect(screen.getByText('¡Subiste a B2!')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.queryByText('¡Subiste a B2!')).not.toBeInTheDocument()
  })

  it('dismisses on button click', () => {
    mockLocalStorage.setItem('last_known_level', 'B1')
    render(<LevelUpOverlay currentLevel="B2" />)

    act(() => { screen.getByText('Continuar').click() })
    expect(screen.queryByText('¡Subiste a B2!')).not.toBeInTheDocument()
  })

  it('fires confetti on level up', async () => {
    const confetti = (await import('canvas-confetti')).default as unknown as ReturnType<typeof vi.fn>
    confetti.mockClear()
    mockLocalStorage.setItem('last_known_level', 'B1')
    render(<LevelUpOverlay currentLevel="B2" />)
    // Flush async import promise
    await act(async () => { await Promise.resolve() })
    expect(confetti).toHaveBeenCalled()
  })

  it('does not render when currentLevel is null', () => {
    render(<LevelUpOverlay currentLevel={null} />)
    expect(screen.queryByText(/Subiste/)).not.toBeInTheDocument()
  })
})
