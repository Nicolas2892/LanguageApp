import { describe, it, expect, vi, afterEach } from 'vitest'
import { isOnline, onStatusChange } from '../network'

describe('network', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isOnline', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      expect(isOnline()).toBe(true)
    })

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      expect(isOnline()).toBe(false)
    })
  })

  describe('onStatusChange', () => {
    it('calls callback on online event', () => {
      const cb = vi.fn()
      const cleanup = onStatusChange(cb)

      window.dispatchEvent(new Event('online'))
      expect(cb).toHaveBeenCalledWith(true)

      cleanup()
    })

    it('calls callback on offline event', () => {
      const cb = vi.fn()
      const cleanup = onStatusChange(cb)

      window.dispatchEvent(new Event('offline'))
      expect(cb).toHaveBeenCalledWith(false)

      cleanup()
    })

    it('removes listeners on cleanup', () => {
      const cb = vi.fn()
      const cleanup = onStatusChange(cb)
      cleanup()

      window.dispatchEvent(new Event('online'))
      expect(cb).not.toHaveBeenCalled()
    })
  })
})
