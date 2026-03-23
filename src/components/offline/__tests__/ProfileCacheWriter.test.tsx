import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { ProfileCacheWriter } from '../ProfileCacheWriter'

const mockPutCachedProfile = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/offline/db', () => ({
  putCachedProfile: (...args: unknown[]) => mockPutCachedProfile(...args),
}))

describe('ProfileCacheWriter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes profile to IDB on mount', async () => {
    render(
      <ProfileCacheWriter
        displayName="Nico"
        streak={5}
        streakFreezeRemaining={1}
        computedLevel="B2"
        timezone="Europe/Berlin"
      />,
    )

    await waitFor(() => {
      expect(mockPutCachedProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'current',
          display_name: 'Nico',
          streak: 5,
          streak_freeze_remaining: 1,
          computed_level: 'B2',
          timezone: 'Europe/Berlin',
        }),
      )
    })
  })

  it('renders nothing', () => {
    const { container } = render(
      <ProfileCacheWriter
        displayName={null}
        streak={0}
        streakFreezeRemaining={0}
        computedLevel={null}
        timezone={null}
      />,
    )
    expect(container.innerHTML).toBe('')
  })
})
