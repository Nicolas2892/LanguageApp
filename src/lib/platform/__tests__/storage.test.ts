import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storage } from '../storage'

function createMockStorage() {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size },
    key: vi.fn(() => null),
  }
}

describe('storage', () => {
  let mockLocal: ReturnType<typeof createMockStorage>
  let mockSession: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mockLocal = createMockStorage()
    mockSession = createMockStorage()
    vi.stubGlobal('localStorage', mockLocal)
    vi.stubGlobal('sessionStorage', mockSession)
  })

  describe('localStorage wrappers', () => {
    it('get returns the stored value', () => {
      mockLocal.setItem('key', 'value')
      expect(storage.get('key')).toBe('value')
    })

    it('get returns null for missing keys', () => {
      expect(storage.get('missing')).toBeNull()
    })

    it('set stores a value', () => {
      storage.set('key', 'value')
      expect(mockLocal.setItem).toHaveBeenCalledWith('key', 'value')
    })

    it('remove deletes a value', () => {
      mockLocal.setItem('key', 'value')
      storage.remove('key')
      expect(mockLocal.removeItem).toHaveBeenCalledWith('key')
    })

    it('get returns null when localStorage throws', () => {
      mockLocal.getItem.mockImplementation(() => { throw new Error('SecurityError') })
      expect(storage.get('key')).toBeNull()
    })

    it('set swallows errors silently', () => {
      mockLocal.setItem.mockImplementation(() => { throw new Error('QuotaExceeded') })
      expect(() => storage.set('key', 'value')).not.toThrow()
    })

    it('remove swallows errors silently', () => {
      mockLocal.removeItem.mockImplementation(() => { throw new Error('SecurityError') })
      expect(() => storage.remove('key')).not.toThrow()
    })
  })

  describe('sessionStorage wrappers', () => {
    it('getSession returns the stored value', () => {
      mockSession.setItem('key', 'value')
      expect(storage.getSession('key')).toBe('value')
    })

    it('getSession returns null for missing keys', () => {
      expect(storage.getSession('missing')).toBeNull()
    })

    it('setSession stores a value', () => {
      storage.setSession('key', 'value')
      expect(mockSession.setItem).toHaveBeenCalledWith('key', 'value')
    })

    it('removeSession deletes a value', () => {
      mockSession.setItem('key', 'value')
      storage.removeSession('key')
      expect(mockSession.removeItem).toHaveBeenCalledWith('key')
    })

    it('getSession returns null when sessionStorage throws', () => {
      mockSession.getItem.mockImplementation(() => { throw new Error('SecurityError') })
      expect(storage.getSession('key')).toBeNull()
    })
  })
})
