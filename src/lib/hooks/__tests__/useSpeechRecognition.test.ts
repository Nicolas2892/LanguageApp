import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpeechRecognition } from '../useSpeechRecognition'

// --- MediaRecorder mock ---

let recorderInstances: MockMediaRecorder[] = []

class MockMediaRecorder {
  state: 'inactive' | 'recording' = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  mimeType: string

  constructor(_stream: MediaStream, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? 'audio/webm'
    recorderInstances.push(this)
  }

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    // Simulate data chunk
    this.ondataavailable?.({ data: new Blob(['audio-data'], { type: this.mimeType }) })
    this.onstop?.()
  }

  static isTypeSupported(mime: string) {
    return mime === 'audio/webm;codecs=opus' || mime === 'audio/webm'
  }
}

// --- getUserMedia mock ---

const mockStop = vi.fn()
const mockStream = {
  getTracks: () => [{ stop: mockStop }],
} as unknown as MediaStream

const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream)

// --- fetch mock ---

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ text: 'Hola mundo' }),
})

beforeEach(() => {
  recorderInstances = []
  vi.clearAllMocks()

  vi.stubGlobal('MediaRecorder', MockMediaRecorder)
  vi.stubGlobal('fetch', mockFetch)

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSpeechRecognition (MediaRecorder + Whisper)', () => {
  describe('supported detection', () => {
    it('reports supported=true when MediaRecorder and getUserMedia are available', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.supported).toBe(true)
    })

    it('reports supported=false when MediaRecorder is not available', async () => {
      vi.stubGlobal('MediaRecorder', undefined)
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.supported).toBe(false)
    })

    it('reports supported=false when navigator.mediaDevices is absent', async () => {
      Object.defineProperty(globalThis.navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.supported).toBe(false)
    })
  })

  describe('initial state', () => {
    it('starts with listening=false, processing=false, transcript="", error=null, permissionState="unknown"', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.listening).toBe(false)
      expect(result.current.processing).toBe(false)
      expect(result.current.transcript).toBe('')
      expect(result.current.error).toBeNull()
      expect(result.current.permissionState).toBe('unknown')
    })
  })

  describe('start()', () => {
    it('requests getUserMedia and creates a MediaRecorder', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      // Wait for the async getUserMedia promise to resolve
      await act(async () => {})

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
      expect(recorderInstances).toHaveLength(1)
      expect(result.current.listening).toBe(true)
    })

    it('resets error and transcript before starting', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      // Start and stop to get a transcript
      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(result.current.transcript).toBe('Hola mundo')

      // Start again — should reset
      await act(async () => { result.current.start() })
      await act(async () => {})
      expect(result.current.transcript).toBe('')
      expect(result.current.error).toBeNull()
    })

    it('is a no-op if already listening', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.start() })
      await act(async () => {})

      // Should only have one MediaRecorder instance
      expect(recorderInstances).toHaveLength(1)
    })
  })

  describe('stop() and transcription', () => {
    it('stops recording, sets processing=true, then returns transcript', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})

      expect(result.current.listening).toBe(true)

      await act(async () => { result.current.stop() })

      // After stop, listening should be false
      expect(result.current.listening).toBe(false)

      // Wait for processing to complete
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(result.current.transcript).toBe('Hola mundo')
      expect(result.current.permissionState).toBe('granted')
    })

    it('calls /api/transcribe with FormData containing audio', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(mockFetch).toHaveBeenCalledWith('/api/transcribe', expect.objectContaining({
        method: 'POST',
      }))
      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[1].body).toBeInstanceOf(FormData)
    })

    it('stops media tracks to dismiss iOS mic indicator', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(mockStop).toHaveBeenCalled()
    })
  })

  describe('permission denied', () => {
    it('sets permissionState=denied and error=not-allowed when getUserMedia rejects with NotAllowedError', async () => {
      const notAllowed = new DOMException('Permission denied', 'NotAllowedError')
      mockGetUserMedia.mockRejectedValueOnce(notAllowed)

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})

      expect(result.current.permissionState).toBe('denied')
      expect(result.current.error).toBe('not-allowed')
      expect(result.current.listening).toBe(false)
    })

    it('sets error=audio-capture for other getUserMedia errors', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new DOMException('No devices', 'NotFoundError'))

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})

      expect(result.current.error).toBe('audio-capture')
      expect(result.current.listening).toBe(false)
    })
  })

  describe('fetch errors', () => {
    it('sets error=service-not-allowed on 429 response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429, json: () => Promise.resolve({}) })

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(result.current.error).toBe('service-not-allowed')
    })

    it('sets error=network on non-429 failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(result.current.error).toBe('network')
    })

    it('sets error=network on fetch rejection', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'))

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })
      await waitFor(() => expect(result.current.processing).toBe(false))

      expect(result.current.error).toBe('network')
    })
  })

  describe('empty recording', () => {
    it('sets error=no-speech when recording produces empty blob', async () => {
      // Override MockMediaRecorder to produce empty data
      class EmptyRecorder extends MockMediaRecorder {
        stop() {
          this.state = 'inactive'
          this.ondataavailable?.({ data: new Blob([], { type: 'audio/webm' }) })
          this.onstop?.()
        }
      }
      vi.stubGlobal('MediaRecorder', EmptyRecorder)

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})
      await act(async () => { result.current.stop() })

      expect(result.current.error).toBe('no-speech')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('unmount cleanup', () => {
    it('stops media tracks on unmount', async () => {
      const { result, unmount } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})

      unmount()
      expect(mockStop).toHaveBeenCalled()
    })
  })

  describe('60-second timeout', () => {
    it('auto-stops recording after 60 seconds', async () => {
      vi.useFakeTimers()

      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})

      await act(async () => { result.current.start() })
      await act(async () => {})

      expect(result.current.listening).toBe(true)

      // Advance past the 60s timeout
      await act(async () => { vi.advanceTimersByTime(61_000) })

      // The recorder's stop was called which triggers onstop
      expect(result.current.listening).toBe(false)

      vi.useRealTimers()
    })
  })
})
