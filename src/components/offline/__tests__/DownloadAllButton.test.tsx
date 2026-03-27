import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadAllButton } from '../DownloadAllButton'
import type { DownloadAllState } from '@/lib/offline/useDownloadAll'

// Mock the hook
const mockDownloadAll = vi.fn()
const mockCancel = vi.fn()
const mockReset = vi.fn()
let mockState: DownloadAllState = {
  phase: 'idle',
  completedModules: 0,
  totalModules: 0,
  skippedModules: 0,
  failedModules: 0,
  currentModuleTitle: null as string | null,
  error: null as string | null,
}

vi.mock('@/lib/offline/useDownloadAll', () => ({
  useDownloadAll: () => ({
    state: mockState,
    downloadAll: mockDownloadAll,
    cancel: mockCancel,
    reset: mockReset,
  }),
}))

const testModules = [
  { id: 'mod-1', title: 'Module 1' },
  { id: 'mod-2', title: 'Module 2' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockState = {
    phase: 'idle',
    completedModules: 0,
    totalModules: 0,
    skippedModules: 0,
    failedModules: 0,
    currentModuleTitle: null,
    error: null,
  }
  mockDownloadAll.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DownloadAllButton', () => {
  it('renders idle state with module count', () => {
    render(<DownloadAllButton modules={testModules} />)
    expect(screen.getByText('Descargar Todo para Offline')).toBeTruthy()
    expect(screen.getByText(/2 módulos/)).toBeTruthy()
  })

  it('calls downloadAll on click', async () => {
    const user = userEvent.setup()
    render(<DownloadAllButton modules={testModules} />)

    await user.click(screen.getByText('Descargar Todo para Offline'))
    expect(mockDownloadAll).toHaveBeenCalledWith(testModules)
  })

  it('shows downloading state with progress', () => {
    mockState = {
      phase: 'downloading',
      completedModules: 1,
      totalModules: 3,
      skippedModules: 0,
      failedModules: 0,
      currentModuleTitle: 'Connectors',
      error: null,
    }
    render(<DownloadAllButton modules={testModules} />)
    expect(screen.getByText('Descargando 1/3…')).toBeTruthy()
    expect(screen.getByText('Connectors')).toBeTruthy()
  })

  it('shows cancel button during download', () => {
    mockState = {
      ...mockState,
      phase: 'downloading',
      totalModules: 2,
    }
    render(<DownloadAllButton modules={testModules} />)
    expect(screen.getByLabelText('Cancelar descarga')).toBeTruthy()
  })

  it('shows complete state', () => {
    mockState = {
      phase: 'complete',
      completedModules: 2,
      totalModules: 2,
      skippedModules: 0,
      failedModules: 0,
      currentModuleTitle: null,
      error: null,
    }
    render(<DownloadAllButton modules={testModules} />)
    expect(screen.getByText('Todo descargado')).toBeTruthy()
  })

  it('shows "Todo disponible offline" when all skipped', () => {
    mockState = {
      phase: 'complete',
      completedModules: 2,
      totalModules: 2,
      skippedModules: 2,
      failedModules: 0,
      currentModuleTitle: null,
      error: null,
    }
    render(<DownloadAllButton modules={testModules} />)
    expect(screen.getByText('Todo disponible offline')).toBeTruthy()
  })

  it('shows error state with retry', () => {
    mockState = {
      phase: 'error',
      completedModules: 2,
      totalModules: 2,
      skippedModules: 0,
      failedModules: 2,
      currentModuleTitle: null,
      error: 'La descarga falló',
    }
    render(<DownloadAllButton modules={testModules} />)
    expect(screen.getByText('La descarga falló')).toBeTruthy()
    expect(screen.getByText('Reintentar')).toBeTruthy()
  })

  it('calls onComplete after download', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<DownloadAllButton modules={testModules} onComplete={onComplete} />)

    await user.click(screen.getByText('Descargar Todo para Offline'))
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
  })
})
