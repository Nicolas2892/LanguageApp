import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeScreen } from '../WelcomeScreen'

vi.mock('@/components/BackgroundMagicS', () => ({
  BackgroundMagicS: () => null,
}))
vi.mock('@/components/SvgSendaPath', () => ({
  SvgSendaPath: () => <svg data-testid="senda-path" />,
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

describe('WelcomeScreen', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders welcome screen when not seen', () => {
    render(
      <WelcomeScreen>
        <div data-testid="child">Child content</div>
      </WelcomeScreen>
    )
    expect(screen.getByText('Senda')).toBeInTheDocument()
    expect(screen.getByText('Tu camino al español avanzado')).toBeInTheDocument()
    expect(screen.getByText('Empezar →')).toBeInTheDocument()
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })

  it('renders children when already seen', () => {
    mockLocalStorage.setItem('welcome_seen', '1')
    render(
      <WelcomeScreen>
        <div data-testid="child">Child content</div>
      </WelcomeScreen>
    )
    expect(screen.queryByText('Senda')).not.toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('transitions to children on button click', () => {
    vi.useFakeTimers()
    render(
      <WelcomeScreen>
        <div data-testid="child">Child content</div>
      </WelcomeScreen>
    )

    act(() => { screen.getByText('Empezar →').click() })

    // Wait for fade out
    act(() => { vi.advanceTimersByTime(300) })

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(mockLocalStorage.getItem('welcome_seen')).toBe('1')
    vi.useRealTimers()
  })
})
