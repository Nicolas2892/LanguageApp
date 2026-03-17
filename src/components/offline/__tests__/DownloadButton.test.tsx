import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadButton } from '../DownloadButton'

// Mock the download manager hook
const mockDownloadModule = vi.fn()
const mockRemoveModule = vi.fn()
const mockIsModuleDownloaded = vi.fn()

vi.mock('@/lib/offline/useDownloadManager', () => ({
  useDownloadManager: () => ({
    downloadState: mockDownloadState,
    downloadProgress: mockDownloadProgress,
    error: null,
    downloadModule: mockDownloadModule,
    removeModule: mockRemoveModule,
    getDownloadedModules: vi.fn().mockResolvedValue([]),
    isModuleDownloaded: mockIsModuleDownloaded,
  }),
}))

let mockDownloadState = 'idle' as string
let mockDownloadProgress = 0

beforeEach(() => {
  mockDownloadState = 'idle'
  mockDownloadProgress = 0
  mockDownloadModule.mockReset()
  mockRemoveModule.mockReset()
  mockIsModuleDownloaded.mockReset().mockResolvedValue(false)
})

describe('DownloadButton', () => {
  it('renders download state when not downloaded', async () => {
    render(<DownloadButton moduleId="mod-1" />)
    expect(await screen.findByText('Descarga')).toBeInTheDocument()
  })

  it('renders offline state when downloaded', async () => {
    mockIsModuleDownloaded.mockResolvedValue(true)
    render(<DownloadButton moduleId="mod-1" />)
    expect(await screen.findByText('Offline')).toBeInTheDocument()
  })

  it('calls downloadModule on click when not downloaded', async () => {
    const user = userEvent.setup()
    render(<DownloadButton moduleId="mod-1" />)
    const btn = await screen.findByText('Descarga')
    await user.click(btn)
    expect(mockDownloadModule).toHaveBeenCalledWith('mod-1')
  })

  it('shows confirm dialog when clicking downloaded module', async () => {
    mockIsModuleDownloaded.mockResolvedValue(true)
    const user = userEvent.setup()
    render(<DownloadButton moduleId="mod-1" />)
    const btn = await screen.findByText('Offline')
    await user.click(btn)
    expect(await screen.findByText('Eliminar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('calls removeModule on confirm delete', async () => {
    mockIsModuleDownloaded.mockResolvedValue(true)
    const user = userEvent.setup()
    render(<DownloadButton moduleId="mod-1" />)
    await user.click(await screen.findByText('Offline'))
    await user.click(screen.getByText('Eliminar'))
    expect(mockRemoveModule).toHaveBeenCalledWith('mod-1')
  })

  it('cancels delete confirmation', async () => {
    mockIsModuleDownloaded.mockResolvedValue(true)
    const user = userEvent.setup()
    render(<DownloadButton moduleId="mod-1" />)
    await user.click(await screen.findByText('Offline'))
    await user.click(screen.getByText('Cancelar'))
    // Should return to the "Offline" chip
    expect(await screen.findByText('Offline')).toBeInTheDocument()
  })
})
