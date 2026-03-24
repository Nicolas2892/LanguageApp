import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPlatform } from '../index'

describe('getPlatform', () => {
  afterEach(() => {
    // Clean up any navigator.standalone we may have set
    Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true })
    vi.restoreAllMocks()
  })

  it('returns "web" when not in standalone mode', () => {
    expect(getPlatform()).toBe('web')
  })

  it('returns "pwa" when navigator.standalone is true (iOS)', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    expect(getPlatform()).toBe('pwa')
  })

  it('returns "pwa" when display-mode: standalone matches', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    expect(getPlatform()).toBe('pwa')
  })

  it('returns "web" when matchMedia returns false', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    expect(getPlatform()).toBe('web')
  })
})
