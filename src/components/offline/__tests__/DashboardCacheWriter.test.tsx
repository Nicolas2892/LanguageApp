import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { DashboardCacheWriter } from '../DashboardCacheWriter'

const mockPutDashboardCache = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/offline/db', () => ({
  putDashboardCache: (...args: unknown[]) => mockPutDashboardCache(...args),
}))

describe('DashboardCacheWriter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes dashboard stats to IDB on mount', async () => {
    render(
      <DashboardCacheWriter
        dueCount={12}
        studiedCount={45}
        totalConcepts={100}
      />,
    )

    await waitFor(() => {
      expect(mockPutDashboardCache).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'current',
          due_count: 12,
          studied_count: 45,
          total_concepts: 100,
        }),
      )
    })
  })

  it('renders nothing', () => {
    const { container } = render(
      <DashboardCacheWriter dueCount={0} studiedCount={0} totalConcepts={0} />,
    )
    expect(container.innerHTML).toBe('')
  })
})
