import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfflineGate } from '@/app/study/OfflineGate'

// Mock network status
let mockIsOnline = true
vi.mock('@/lib/offline/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline }),
}))

// Mock IDB
const mockGetAllDownloadedModules = vi.fn()
vi.mock('@/lib/offline/db', () => ({
  getAllDownloadedModules: () => mockGetAllDownloadedModules(),
}))

// Mock OfflineStudySession
vi.mock('@/app/study/OfflineStudySession', () => ({
  OfflineStudySession: () => <div data-testid="offline-session">Offline Session</div>,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

beforeEach(() => {
  mockIsOnline = true
  mockGetAllDownloadedModules.mockReset().mockResolvedValue([])
})

describe('OfflineGate', () => {
  it('renders children when online', () => {
    render(
      <OfflineGate>
        <div data-testid="online-content">Online content</div>
      </OfflineGate>,
    )
    expect(screen.getByTestId('online-content')).toBeInTheDocument()
  })

  it('shows no-downloads message when offline with no downloads', async () => {
    mockIsOnline = false
    mockGetAllDownloadedModules.mockResolvedValue([])

    render(
      <OfflineGate>
        <div>Online content</div>
      </OfflineGate>,
    )

    expect(await screen.findByText('Sin Conexión')).toBeInTheDocument()
  })

  it('renders OfflineStudySession when offline with downloads', async () => {
    mockIsOnline = false
    mockGetAllDownloadedModules.mockResolvedValue([{
      module_id: 'mod-1',
      title: 'Test',
      order_index: 0,
      downloaded_at: '2026-03-15T10:00:00Z',
      exercise_count: 10,
      concept_count: 3,
      version: Date.now(),
    }])

    render(
      <OfflineGate>
        <div>Online content</div>
      </OfflineGate>,
    )

    expect(await screen.findByTestId('offline-session')).toBeInTheDocument()
  })
})
