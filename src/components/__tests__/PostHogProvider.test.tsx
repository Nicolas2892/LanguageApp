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

  it('calls identifyUser with traits when userId is provided', () => {
    render(
      <PostHogProvider
        userId="user-abc"
        computedLevel="B2"
        streak={5}
        timezone="Europe/Berlin"
        streakFreezeRemaining={1}
        masteredCount={10}
        daysSinceSignup={30}
      >
        <div>child</div>
      </PostHogProvider>,
    )
    expect(identifyUser).toHaveBeenCalledWith('user-abc', {
      computed_level: 'B2',
      streak: 5,
      timezone: 'Europe/Berlin',
      streak_freeze_remaining: 1,
      mastered_count: 10,
      days_since_signup: 30,
    })
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
