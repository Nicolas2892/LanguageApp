import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfflineStorageManager } from '../OfflineStorageManager'

// Mock IDB functions
const mockGetAllDownloadedModules = vi.fn()
const mockGetStorageStats = vi.fn()
const mockClearAllOfflineData = vi.fn()
const mockDeleteModuleData = vi.fn()

vi.mock('@/lib/offline/db', () => ({
  getAllDownloadedModules: () => mockGetAllDownloadedModules(),
  getStorageStats: () => mockGetStorageStats(),
  clearAllOfflineData: () => mockClearAllOfflineData(),
  deleteModuleData: (id: string) => mockDeleteModuleData(id),
}))

const emptyStats = {
  downloadedModuleCount: 0,
  exerciseCount: 0,
  conceptCount: 0,
  queuedAttemptCount: 0,
  queuedVerbAttemptCount: 0,
  verbCacheCount: 0,
  verbSentenceCacheCount: 0,
}

beforeEach(() => {
  mockGetAllDownloadedModules.mockReset().mockResolvedValue([])
  mockGetStorageStats.mockReset().mockResolvedValue(emptyStats)
  mockClearAllOfflineData.mockReset().mockResolvedValue(undefined)
  mockDeleteModuleData.mockReset().mockResolvedValue(undefined)
})

describe('OfflineStorageManager', () => {
  it('shows empty state when no data', async () => {
    render(<OfflineStorageManager />)
    expect(await screen.findByText('No hay datos offline almacenados.')).toBeInTheDocument()
  })

  it('shows downloaded modules', async () => {
    mockGetAllDownloadedModules.mockResolvedValue([{
      module_id: 'mod-1',
      title: 'Connectors',
      order_index: 0,
      downloaded_at: '2026-03-15T10:00:00Z',
      exercise_count: 25,
      concept_count: 5,
      version: Date.now(),
    }])
    mockGetStorageStats.mockResolvedValue({
      ...emptyStats,
      downloadedModuleCount: 1,
      exerciseCount: 25,
    })

    render(<OfflineStorageManager />)
    expect(await screen.findByText('Connectors')).toBeInTheDocument()
    expect(screen.getAllByText(/25 ejercicios/).length).toBeGreaterThanOrEqual(1)
  })

  it('calls clearAllOfflineData on "Eliminar todo"', async () => {
    mockGetStorageStats.mockResolvedValue({
      ...emptyStats,
      downloadedModuleCount: 1,
      exerciseCount: 10,
    })
    mockGetAllDownloadedModules.mockResolvedValue([{
      module_id: 'mod-1',
      title: 'Test',
      order_index: 0,
      downloaded_at: '2026-03-15T10:00:00Z',
      exercise_count: 10,
      concept_count: 3,
      version: Date.now(),
    }])

    const user = userEvent.setup()
    render(<OfflineStorageManager />)
    const btn = await screen.findByText('Eliminar todo')
    await user.click(btn)
    expect(mockClearAllOfflineData).toHaveBeenCalled()
  })

  it('deletes individual module', async () => {
    mockGetAllDownloadedModules.mockResolvedValue([{
      module_id: 'mod-1',
      title: 'Connectors',
      order_index: 0,
      downloaded_at: '2026-03-15T10:00:00Z',
      exercise_count: 10,
      concept_count: 3,
      version: Date.now(),
    }])
    mockGetStorageStats.mockResolvedValue({
      ...emptyStats,
      downloadedModuleCount: 1,
      exerciseCount: 10,
    })

    const user = userEvent.setup()
    render(<OfflineStorageManager />)
    const deleteBtn = await screen.findByLabelText('Eliminar Connectors')
    await user.click(deleteBtn)
    expect(mockDeleteModuleData).toHaveBeenCalledWith('mod-1')
  })
})
