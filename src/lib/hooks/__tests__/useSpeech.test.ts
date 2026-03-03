import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeech } from '../useSpeech'

let mockStorage: Record<string, string> = {}

const utteranceInstances: { lang: string; text: string }[] = []

class MockSpeechSynthesisUtterance {
  lang = ''
  text: string
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
    utteranceInstances.push(this)
  }
}

const speechSynthesisMock = {
  speak: vi.fn(),
  cancel: vi.fn(),
}

beforeEach(() => {
  mockStorage = {}
  utteranceInstances.length = 0
  speechSynthesisMock.speak.mockClear()
  speechSynthesisMock.cancel.mockClear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value },
    removeItem: (key: string) => { delete mockStorage[key] },
  })
  vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
  vi.stubGlobal('speechSynthesis', speechSynthesisMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSpeech', () => {
  describe('enabled state', () => {
    it('defaults to true when no localStorage value', async () => {
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      expect(result.current.enabled).toBe(true)
    })

    it('reads false from localStorage when audio_enabled is "false"', async () => {
      mockStorage['audio_enabled'] = 'false'
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      expect(result.current.enabled).toBe(false)
    })
  })

  describe('speak()', () => {
    it('calls speechSynthesis.speak when enabled', async () => {
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      act(() => { result.current.speak('Hola mundo') })
      expect(speechSynthesisMock.speak).toHaveBeenCalledOnce()
    })

    it('uses es-ES as the default language', async () => {
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      act(() => { result.current.speak('Hola') })
      expect(utteranceInstances[0].lang).toBe('es-ES')
    })

    it('calls cancel before speaking to interrupt previous utterance', async () => {
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      act(() => { result.current.speak('Hola') })
      expect(speechSynthesisMock.cancel).toHaveBeenCalled()
      // cancel must be called before speak
      const cancelOrder = speechSynthesisMock.cancel.mock.invocationCallOrder[0]
      const speakOrder = speechSynthesisMock.speak.mock.invocationCallOrder[0]
      expect(cancelOrder).toBeLessThan(speakOrder)
    })

    it('does not call speechSynthesis.speak when audio is disabled', async () => {
      mockStorage['audio_enabled'] = 'false'
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      act(() => { result.current.speak('Hola') })
      expect(speechSynthesisMock.speak).not.toHaveBeenCalled()
    })
  })

  describe('toggle()', () => {
    it('changes enabled from true to false and persists to localStorage', async () => {
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      expect(result.current.enabled).toBe(true)
      act(() => { result.current.toggle() })
      expect(result.current.enabled).toBe(false)
      expect(mockStorage['audio_enabled']).toBe('false')
    })

    it('changes enabled from false to true and persists to localStorage', async () => {
      mockStorage['audio_enabled'] = 'false'
      const { result } = renderHook(() => useSpeech())
      await act(async () => {})
      expect(result.current.enabled).toBe(false)
      act(() => { result.current.toggle() })
      expect(result.current.enabled).toBe(true)
      expect(mockStorage['audio_enabled']).toBe('true')
    })
  })
})
