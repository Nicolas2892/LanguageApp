import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ReconnectRefresher } from '../ReconnectRefresher'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

describe('ReconnectRefresher', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('renders nothing by default', () => {
    const { container } = render(<ReconnectRefresher />)
    expect(container.innerHTML).toBe('')
  })

  it('calls router.refresh on online event', () => {
    render(<ReconnectRefresher />)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(mockRefresh).toHaveBeenCalledOnce()
  })

  it('shows toast on online event', () => {
    render(<ReconnectRefresher />)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByText('Conexión restaurada')).toBeDefined()
  })
})
