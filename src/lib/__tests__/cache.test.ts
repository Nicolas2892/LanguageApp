import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCached, invalidateCache, clearCache } from '../cache'

describe('cache', () => {
  beforeEach(() => {
    clearCache()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns fetcher result on cache miss', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: '1', title: 'Test' })
    const result = await getCached('key:1', fetcher)
    expect(result).toEqual({ id: '1', title: 'Test' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('returns cached value on cache hit without calling fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: '1', title: 'Test' })
    await getCached('key:1', fetcher)
    const result = await getCached('key:1', fetcher)
    expect(result).toEqual({ id: '1', title: 'Test' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('re-fetches after TTL expires', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValueOnce({ version: 2 })

    await getCached('key:1', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Advance past TTL
    vi.advanceTimersByTime(1001)

    const result = await getCached('key:1', fetcher, 1000)
    expect(result).toEqual({ version: 2 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not re-fetch before TTL expires', async () => {
    const fetcher = vi.fn().mockResolvedValue({ version: 1 })

    await getCached('key:1', fetcher, 5000)
    vi.advanceTimersByTime(4999)
    await getCached('key:1', fetcher, 5000)

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('invalidateCache removes entries matching prefix', async () => {
    const fetcher1 = vi.fn().mockResolvedValue('a')
    const fetcher2 = vi.fn().mockResolvedValue('b')
    const fetcher3 = vi.fn().mockResolvedValue('c')

    await getCached('exercise:1', fetcher1)
    await getCached('exercise:2', fetcher2)
    await getCached('concept:1', fetcher3)

    invalidateCache('exercise:')

    // exercise entries should be re-fetched
    const newFetcher1 = vi.fn().mockResolvedValue('a2')
    const newFetcher2 = vi.fn().mockResolvedValue('b2')
    const newFetcher3 = vi.fn().mockResolvedValue('c')

    const r1 = await getCached('exercise:1', newFetcher1)
    const r2 = await getCached('exercise:2', newFetcher2)
    const r3 = await getCached('concept:1', newFetcher3)

    expect(r1).toBe('a2')
    expect(r2).toBe('b2')
    expect(r3).toBe('c') // concept cache untouched
    expect(newFetcher1).toHaveBeenCalledTimes(1)
    expect(newFetcher2).toHaveBeenCalledTimes(1)
    expect(newFetcher3).not.toHaveBeenCalled()
  })

  it('clearCache removes all entries', async () => {
    const fetcher = vi.fn().mockResolvedValue('val')
    await getCached('key:1', fetcher)

    clearCache()

    const newFetcher = vi.fn().mockResolvedValue('val2')
    const result = await getCached('key:1', newFetcher)
    expect(result).toBe('val2')
    expect(newFetcher).toHaveBeenCalledTimes(1)
  })

  it('uses default 5-minute TTL when not specified', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')

    await getCached('key:1', fetcher)

    // At 4m 59s — still cached
    vi.advanceTimersByTime(299_999)
    await getCached('key:1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    // At 5m 1ms — expired
    vi.advanceTimersByTime(2)
    const result = await getCached('key:1', fetcher)
    expect(result).toBe('second')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
