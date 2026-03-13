import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StreakFreezeNotification } from '../StreakFreezeNotification'

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const mockStorage = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size },
  key: (_i: number) => null as string | null,
}

describe('StreakFreezeNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockStorage.clear()
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows toast when freezeUsedDate matches yesterday', () => {
    const yesterday = getYesterday()
    render(<StreakFreezeNotification freezeUsedDate={yesterday} streak={5} />)
    expect(screen.getByText('¡Tu racha fue protegida!')).toBeInTheDocument()
  })

  it('does not show when freezeUsedDate is null', () => {
    render(<StreakFreezeNotification freezeUsedDate={null} streak={5} />)
    expect(screen.queryByText('¡Tu racha fue protegida!')).not.toBeInTheDocument()
  })

  it('does not show when freezeUsedDate is older than yesterday', () => {
    render(<StreakFreezeNotification freezeUsedDate="2020-01-01" streak={5} />)
    expect(screen.queryByText('¡Tu racha fue protegida!')).not.toBeInTheDocument()
  })

  it('does not show when localStorage key already set', () => {
    const yesterday = getYesterday()
    mockStorage.set(`streak_freeze_used_${yesterday}`, '1')
    render(<StreakFreezeNotification freezeUsedDate={yesterday} streak={5} />)
    expect(screen.queryByText('¡Tu racha fue protegida!')).not.toBeInTheDocument()
  })

  it('auto-dismisses after 6 seconds', () => {
    const yesterday = getYesterday()
    render(<StreakFreezeNotification freezeUsedDate={yesterday} streak={5} />)
    expect(screen.getByText('¡Tu racha fue protegida!')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.queryByText('¡Tu racha fue protegida!')).not.toBeInTheDocument()
  })

  it('does not render when streak is 0', () => {
    const yesterday = getYesterday()
    render(<StreakFreezeNotification freezeUsedDate={yesterday} streak={0} />)
    expect(screen.queryByText('¡Tu racha fue protegida!')).not.toBeInTheDocument()
  })

  it('dismisses on close button click', async () => {
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
    const yesterday = getYesterday()
    render(<StreakFreezeNotification freezeUsedDate={yesterday} streak={5} />)
    expect(screen.getByText('¡Tu racha fue protegida!')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Cerrar'))
    expect(screen.queryByText('¡Tu racha fue protegida!')).not.toBeInTheDocument()
  })
})
