import { describe, it, expect, vi, afterEach } from 'vitest'
import { isIOSDevice, isInstalledPWA, isSafariBrowser } from '../pwa'

describe('pwa', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isIOSDevice', () => {
    it('returns true for iPhone user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      })
      expect(isIOSDevice()).toBe(true)
    })

    it('returns true for iPad with touch points', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
      expect(isIOSDevice()).toBe(true)
    })

    it('returns false for Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13)',
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
      expect(isIOSDevice()).toBe(false)
    })
  })

  describe('isInstalledPWA', () => {
    it('returns true when navigator.standalone is true', () => {
      Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
      expect(isInstalledPWA()).toBe(true)
    })

    it('returns true when display-mode: standalone matches', () => {
      Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true })
      window.matchMedia = vi.fn().mockReturnValue({ matches: true })
      expect(isInstalledPWA()).toBe(true)
    })

    it('returns false when not standalone', () => {
      Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
      window.matchMedia = vi.fn().mockReturnValue({ matches: false })
      expect(isInstalledPWA()).toBe(false)
    })
  })

  describe('isSafariBrowser', () => {
    it('returns true for Safari UA', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      expect(isSafariBrowser()).toBe(true)
    })

    it('returns false for Chrome on iOS (CriOS)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) CriOS/100.0 Safari/604.1',
        configurable: true,
      })
      expect(isSafariBrowser()).toBe(false)
    })

    it('returns false for Firefox on iOS (FxiOS)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) FxiOS/100.0 Safari/604.1',
        configurable: true,
      })
      expect(isSafariBrowser()).toBe(false)
    })
  })
})
