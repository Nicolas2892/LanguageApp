import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNativeAudio } from '../useNativeAudio'

// Mock Audio constructor
let mockAudioInstances: Array<{
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
  onplay: (() => void) | null
  onended: (() => void) | null
  onerror: (() => void) | null
}> = []

class MockAudio {
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  onplay: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    mockAudioInstances.push(this)
  }
}

vi.stubGlobal('Audio', MockAudio)

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-audio-url')
const mockRevokeObjectURL = vi.fn()
vi.stubGlobal('URL', { ...globalThis.URL, createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL })

describe('useNativeAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAudioInstances = []
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with idle state', () => {
    const { result } = renderHook(() => useNativeAudio())
    expect(result.current.playing).toBe(false)
    expect(result.current.audioUrl).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches audio from /api/tts on play', async () => {
    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Hola mundo')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hola mundo' }),
    })
  })

  it('creates object URL and sets audioUrl', async () => {
    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Test')
    })

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(result.current.audioUrl).toBe('blob:test-audio-url')
  })

  it('sets playing=true when audio plays', async () => {
    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Test')
    })

    // Trigger onplay callback
    const audio = mockAudioInstances[0]
    act(() => { audio.onplay?.() })

    expect(result.current.playing).toBe(true)
  })

  it('sets playing=false when audio ends', async () => {
    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Test')
    })

    const audio = mockAudioInstances[0]
    act(() => { audio.onplay?.() })
    act(() => { audio.onended?.() })

    expect(result.current.playing).toBe(false)
  })

  it('caches audio by text (no re-fetch)', async () => {
    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Same text')
    })
    await act(async () => {
      result.current.play('Same text')
    })

    // Only one fetch, but two Audio instances
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockAudioInstances.length).toBe(2)
  })

  it('sets error on rate limit (429)', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429 })

    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Test')
    })

    expect(result.current.error).toBe('rate-limit')
  })

  it('sets error on network failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Test')
    })

    expect(result.current.error).toBe('network')
  })

  it('sets error on fetch exception', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useNativeAudio())

    await act(async () => {
      result.current.play('Test')
    })

    expect(result.current.error).toBe('network')
  })
})
