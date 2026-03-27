import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDownloadAll } from '../useDownloadAll'

// Mock db functions
vi.mock('../db', () => ({
  isModuleDownloaded: vi.fn(),
  putDownloadedModule: vi.fn().mockResolvedValue(undefined),
  putExercises: vi.fn().mockResolvedValue(undefined),
  putConcepts: vi.fn().mockResolvedValue(undefined),
  putUnits: vi.fn().mockResolvedValue(undefined),
  putUserProgress: vi.fn().mockResolvedValue(undefined),
  putFreeWritePrompts: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics', () => ({
  trackOfflineDownloadAll: vi.fn(),
}))

import { isModuleDownloaded } from '../db'
import { trackOfflineDownloadAll } from '@/lib/analytics'

const mockIsModuleDownloaded = vi.mocked(isModuleDownloaded)

function makeBundleResponse(id: string, title: string) {
  return {
    module: { id, title, order_index: 1 },
    units: [{ id: 'u1', module_id: id, title: 'Unit 1', order_index: 1 }],
    concepts: [{
      id: 'c1', unit_id: 'u1', type: 'grammar', title: 'Concept',
      explanation: 'test', examples: [], difficulty: 1, level: 'B1', grammar_focus: null,
    }],
    exercises: [{
      id: 'e1', concept_id: 'c1', type: 'gap_fill', prompt: 'test',
      expected_answer: 'answer', answer_variants: null,
      hint_1: null, hint_2: null, annotations: null, source: 'seed',
    }],
    user_progress: [],
    free_write_prompts: [],
    version: Date.now(),
  }
}

const testModules = [
  { id: 'mod-1', title: 'Module 1' },
  { id: 'mod-2', title: 'Module 2' },
  { id: 'mod-3', title: 'Module 3' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockIsModuleDownloaded.mockResolvedValue(false)
  global.fetch = vi.fn().mockImplementation((url: string) => {
    // Module download
    if (url.startsWith('/api/offline/module/')) {
      const id = url.split('/').pop()!
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makeBundleResponse(id, `Module ${id}`)),
      })
    }
    // Route prefetch — always succeed
    return Promise.resolve({ ok: true })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useDownloadAll', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useDownloadAll())
    expect(result.current.state.phase).toBe('idle')
    expect(result.current.state.totalModules).toBe(0)
  })

  it('downloads all modules sequentially', async () => {
    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll(testModules)
    })

    expect(result.current.state.phase).toBe('complete')
    expect(result.current.state.completedModules).toBe(3)
    expect(result.current.state.totalModules).toBe(3)
    expect(result.current.state.failedModules).toBe(0)
    expect(result.current.state.skippedModules).toBe(0)
  })

  it('skips already-downloaded modules', async () => {
    mockIsModuleDownloaded.mockImplementation(async (id: string) => id === 'mod-2')

    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll(testModules)
    })

    expect(result.current.state.phase).toBe('complete')
    expect(result.current.state.skippedModules).toBe(1)
    expect(result.current.state.completedModules).toBe(3)
    // Only 2 module fetches (mod-1 and mod-3), plus 12 route prefetches
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
    const moduleFetches = fetchCalls.filter((c: unknown[]) => typeof c[0] === 'string' && c[0].startsWith('/api/offline/module/'))
    expect(moduleFetches).toHaveLength(2)
  })

  it('handles partial failures gracefully', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/offline/module/mod-2') {
        return Promise.resolve({ ok: false, status: 500 })
      }
      if (url.startsWith('/api/offline/module/')) {
        const id = url.split('/').pop()!
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeBundleResponse(id, `Module ${id}`)),
        })
      }
      return Promise.resolve({ ok: true })
    })

    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll(testModules)
    })

    // Still completes (not full error) since only 1/3 failed
    expect(result.current.state.phase).toBe('complete')
    expect(result.current.state.failedModules).toBe(1)
    expect(result.current.state.completedModules).toBe(3)
    expect(result.current.state.error).toBe('1 módulo(s) fallaron')
  })

  it('sets error phase when all modules fail', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.startsWith('/api/offline/module/')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      return Promise.resolve({ ok: true })
    })

    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll(testModules)
    })

    expect(result.current.state.phase).toBe('error')
    expect(result.current.state.failedModules).toBe(3)
  })

  it('prefetches app routes after modules', async () => {
    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll([testModules[0]])
    })

    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
    const routeFetches = fetchCalls.filter((c: unknown[]) => typeof c[0] === 'string' && !c[0].startsWith('/api/'))
    // 12 routes prefetched
    expect(routeFetches.length).toBe(12)
  })

  it('tracks analytics on completion', async () => {
    mockIsModuleDownloaded.mockImplementation(async (id: string) => id === 'mod-1')

    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll(testModules)
    })

    expect(trackOfflineDownloadAll).toHaveBeenCalledWith(
      expect.objectContaining({
        totalModules: 3,
        skippedModules: 1,
        downloadedModules: 2,
        failedModules: 0,
      })
    )
  })

  it('resets state via reset()', async () => {
    const { result } = renderHook(() => useDownloadAll())

    await act(async () => {
      await result.current.downloadAll(testModules)
    })

    expect(result.current.state.phase).toBe('complete')

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.phase).toBe('idle')
    expect(result.current.state.totalModules).toBe(0)
  })
})
