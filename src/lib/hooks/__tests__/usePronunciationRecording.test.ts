import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePronunciationRecording } from '../usePronunciationRecording'

// Mock MediaRecorder
class MockMediaRecorder {
  state = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  start() { this.state = 'recording' }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }) })
    this.onstop?.()
  }
  static isTypeSupported() { return true }
}

const mockGetUserMedia = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('MediaRecorder', MockMediaRecorder)
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
    },
  })
  global.fetch = vi.fn()
})

describe('usePronunciationRecording', () => {
  it('reports supported when MediaRecorder is available', () => {
    const { result } = renderHook(() => usePronunciationRecording())
    expect(result.current.supported).toBe(true)
  })

  it('starts in idle state with no result', () => {
    const { result } = renderHook(() => usePronunciationRecording())
    expect(result.current.state).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('transitions to recording state when startRecording is called', async () => {
    const stream = { getTracks: () => [{ stop: vi.fn() }] }
    mockGetUserMedia.mockResolvedValue(stream)

    const { result } = renderHook(() => usePronunciationRecording())

    await act(async () => {
      result.current.startRecording('Hola mundo')
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.state).toBe('recording')
    expect(result.current.permissionState).toBe('granted')
  })

  it('sets permission denied error when getUserMedia is rejected', async () => {
    mockGetUserMedia.mockRejectedValue({ name: 'NotAllowedError' })

    const { result } = renderHook(() => usePronunciationRecording())

    await act(async () => {
      result.current.startRecording('Hola mundo')
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.permissionState).toBe('denied')
    expect(result.current.error).toBe('not-allowed')
  })

  it('reports not supported when MediaRecorder is undefined', () => {
    vi.stubGlobal('MediaRecorder', undefined)
    vi.stubGlobal('navigator', { mediaDevices: undefined })
    const { result } = renderHook(() => usePronunciationRecording())
    expect(result.current.supported).toBe(false)
  })

  it('resets result and error on reset()', async () => {
    const { result } = renderHook(() => usePronunciationRecording())

    await act(async () => {
      result.current.reset()
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
