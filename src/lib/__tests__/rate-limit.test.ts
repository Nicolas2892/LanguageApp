import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { checkRateLimit, clearRateLimitStore } from '../rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    clearRateLimitStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request', async () => {
    const result = await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
  })

  it('allows requests up to the limit', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks the request that exceeds the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    }
    const result = await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(false)
  })

  it('resets count after the window expires', async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    }
    // Advance past the window
    vi.advanceTimersByTime(60_001)
    const result = await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
  })

  it('tracks different users independently', async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    }
    // user-2 should still be allowed
    const result = await checkRateLimit('user-2', 'submit', { maxRequests: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
  })

  it('tracks different route keys independently', async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('user-1', 'submit', { maxRequests: 5, windowMs: 60_000 })
    }
    // Different route key should still be allowed
    const result = await checkRateLimit('user-1', 'chat', { maxRequests: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
  })

  it('respects different maxRequests per route', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('user-1', 'topic', { maxRequests: 3, windowMs: 60_000 })
    }
    const result = await checkRateLimit('user-1', 'topic', { maxRequests: 3, windowMs: 60_000 })
    expect(result.allowed).toBe(false)
  })

  it('does not block when window boundary is exact', async () => {
    await checkRateLimit('user-1', 'chat', { maxRequests: 2, windowMs: 1_000 })
    vi.advanceTimersByTime(1_000) // exactly at boundary — new window
    const result = await checkRateLimit('user-1', 'chat', { maxRequests: 2, windowMs: 1_000 })
    expect(result.allowed).toBe(true)
  })
})
