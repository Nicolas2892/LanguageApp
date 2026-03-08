import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition } from '../useSpeechRecognition'

// Track all SpeechRecognition instances created during a test
const instances: MockSpeechRecognition[] = []

class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()

  constructor() {
    instances.push(this)
  }
}

beforeEach(() => {
  instances.length = 0
  vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
  vi.stubGlobal('webkitSpeechRecognition', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSpeechRecognition', () => {
  describe('supported detection', () => {
    it('reports supported=true when SpeechRecognition is available', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.supported).toBe(true)
    })

    it('reports supported=false when neither SpeechRecognition nor webkitSpeechRecognition exist', async () => {
      vi.stubGlobal('SpeechRecognition', undefined)
      vi.stubGlobal('webkitSpeechRecognition', undefined)
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.supported).toBe(false)
    })

    it('falls back to webkitSpeechRecognition when SpeechRecognition is absent', async () => {
      vi.stubGlobal('SpeechRecognition', undefined)
      vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition)
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.supported).toBe(true)
    })
  })

  describe('initial state', () => {
    it('starts with listening=false, transcript="", error=null, permissionState="unknown"', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      expect(result.current.listening).toBe(false)
      expect(result.current.transcript).toBe('')
      expect(result.current.error).toBeNull()
      expect(result.current.permissionState).toBe('unknown')
    })
  })

  describe('start()', () => {
    it('creates a recognition instance and sets listening=true', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      expect(instances).toHaveLength(1)
      expect(instances[0].start).toHaveBeenCalledOnce()
      expect(result.current.listening).toBe(true)
    })

    it('sets lang=es-ES, continuous=false, interimResults=false', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      expect(instances[0].lang).toBe('es-ES')
      expect(instances[0].continuous).toBe(false)
      expect(instances[0].interimResults).toBe(false)
    })

    it('resets transcript and error before starting a new session', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      // First start — trigger an error
      act(() => { result.current.start() })
      act(() => { instances[0].onerror?.({ error: 'no-speech' }) })
      expect(result.current.error).toBe('no-speech')
      // Second start — error and transcript should reset
      act(() => { result.current.start() })
      expect(result.current.error).toBeNull()
      expect(result.current.transcript).toBe('')
    })
  })

  describe('onresult', () => {
    it('updates transcript with recognised text', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      act(() => {
        instances[0].onresult?.({ results: [{ 0: { transcript: 'Hola mundo' } }] })
      })
      expect(result.current.transcript).toBe('Hola mundo')
    })

    it('sets permissionState=granted on successful result', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      act(() => {
        instances[0].onresult?.({ results: [{ 0: { transcript: 'texto' } }] })
      })
      expect(result.current.permissionState).toBe('granted')
    })
  })

  describe('onend', () => {
    it('sets listening=false when recognition ends', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      expect(result.current.listening).toBe(true)
      act(() => { instances[0].onend?.() })
      expect(result.current.listening).toBe(false)
    })
  })

  describe('onerror', () => {
    it('sets error state on no-speech', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      act(() => { instances[0].onerror?.({ error: 'no-speech' }) })
      expect(result.current.error).toBe('no-speech')
      expect(result.current.listening).toBe(false)
    })

    it('sets permissionState=denied on not-allowed error', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      act(() => { instances[0].onerror?.({ error: 'not-allowed' }) })
      expect(result.current.permissionState).toBe('denied')
      expect(result.current.error).toBe('not-allowed')
    })

    it('does not change permissionState for non-permission errors', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      act(() => { instances[0].onerror?.({ error: 'audio-capture' }) })
      expect(result.current.permissionState).toBe('unknown')
    })
  })

  describe('stop()', () => {
    it('calls recognition.stop() and sets listening=false', async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      act(() => { result.current.stop() })
      expect(instances[0].stop).toHaveBeenCalledOnce()
      expect(result.current.listening).toBe(false)
    })
  })

  describe('unmount cleanup', () => {
    it('calls recognition.abort() on unmount', async () => {
      const { result, unmount } = renderHook(() => useSpeechRecognition())
      await act(async () => {})
      act(() => { result.current.start() })
      unmount()
      expect(instances[0].abort).toHaveBeenCalledOnce()
    })
  })
})
