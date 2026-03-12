import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/analytics', () => ({
  initAnalytics: vi.fn(),
  identifyUser: vi.fn(),
}))

import { initAnalytics, identifyUser } from '@/lib/analytics'
import { PostHogProvider } from '../PostHogProvider'

describe('PostHogProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    render(
      <PostHogProvider>
        <div data-testid="child">Hello</div>
      </PostHogProvider>,
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('calls initAnalytics on mount', () => {
    render(
      <PostHogProvider>
        <div>child</div>
      </PostHogProvider>,
    )
    expect(initAnalytics).toHaveBeenCalled()
  })

  it('calls identifyUser when userId is provided', () => {
    render(
      <PostHogProvider userId="user-abc">
        <div>child</div>
      </PostHogProvider>,
    )
    expect(identifyUser).toHaveBeenCalledWith('user-abc')
  })

  it('does not call identifyUser when userId is undefined', () => {
    render(
      <PostHogProvider>
        <div>child</div>
      </PostHogProvider>,
    )
    expect(identifyUser).not.toHaveBeenCalled()
  })
})
