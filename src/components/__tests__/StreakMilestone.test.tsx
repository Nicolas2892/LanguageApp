import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StreakMilestone } from '../StreakMilestone'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
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

describe('StreakMilestone', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStorage.clear()
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows toast for streak milestone of 7', () => {
    render(<StreakMilestone streak={7} />)
    expect(screen.getByText('¡Racha de 7 días!')).toBeInTheDocument()
  })

  it('shows toast for streak milestone of 14', () => {
    render(<StreakMilestone streak={14} />)
    expect(screen.getByText('¡Racha de 14 días!')).toBeInTheDocument()
  })

  it('shows highest milestone reached', () => {
    render(<StreakMilestone streak={35} />)
    expect(screen.getByText('¡Racha de 30 días!')).toBeInTheDocument()
  })

  it('does not show toast when streak is below first milestone', () => {
    render(<StreakMilestone streak={3} />)
    expect(screen.queryByText(/Racha de/)).not.toBeInTheDocument()
  })

  it('does not show toast if already seen', () => {
    mockLocalStorage.setItem('streak_milestone_7_seen', '1')
    render(<StreakMilestone streak={7} />)
    expect(screen.queryByText('¡Racha de 7 días!')).not.toBeInTheDocument()
  })

  it('dismisses on X button click', () => {
    render(<StreakMilestone streak={7} />)
    expect(screen.getByText('¡Racha de 7 días!')).toBeInTheDocument()

    act(() => { screen.getByLabelText('Cerrar').click() })
    expect(screen.queryByText('¡Racha de 7 días!')).not.toBeInTheDocument()
    expect(mockLocalStorage.getItem('streak_milestone_7_seen')).toBe('1')
  })

  it('auto-dismisses after 5 seconds', () => {
    render(<StreakMilestone streak={7} />)
    expect(screen.getByText('¡Racha de 7 días!')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.queryByText('¡Racha de 7 días!')).not.toBeInTheDocument()
  })

  it('fires confetti for milestone >= 30', async () => {
    const confetti = (await import('canvas-confetti')).default as unknown as ReturnType<typeof vi.fn>
    confetti.mockClear()
    render(<StreakMilestone streak={30} />)
    // Flush async import promise
    await act(async () => { await Promise.resolve() })
    expect(confetti).toHaveBeenCalled()
  })

  it('does not fire confetti for milestone < 30', async () => {
    const confetti = (await import('canvas-confetti')).default as unknown as ReturnType<typeof vi.fn>
    confetti.mockClear()
    render(<StreakMilestone streak={14} />)
    expect(confetti).not.toHaveBeenCalled()
  })
})
