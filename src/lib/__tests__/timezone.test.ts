import { describe, it, expect, vi, afterEach } from 'vitest'
import { userLocalToday } from '../timezone'

describe('userLocalToday', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns YYYY-MM-DD format', () => {
    const result = userLocalToday()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns UTC date when timezone is null', () => {
    const result = userLocalToday(null)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns UTC date when timezone is undefined', () => {
    const result = userLocalToday(undefined)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accepts a valid IANA timezone', () => {
    const result = userLocalToday('America/New_York')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('falls back to UTC for invalid timezone', () => {
    const result = userLocalToday('Invalid/Timezone_XYZ')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // Should match UTC fallback
    const utcResult = userLocalToday(null)
    expect(result).toBe(utcResult)
  })

  it('produces a different date when timezone crosses midnight', () => {
    // Mock a time that is 23:30 UTC on 2026-03-13 — still March 13 in UTC,
    // but already March 14 in UTC+2 (Europe/Helsinki)
    const mockDate = new Date('2026-03-13T23:30:00Z')
    vi.setSystemTime(mockDate)

    const utcToday = userLocalToday('UTC')
    const helsinkiToday = userLocalToday('Europe/Helsinki') // UTC+2

    expect(utcToday).toBe('2026-03-13')
    expect(helsinkiToday).toBe('2026-03-14')

    vi.useRealTimers()
  })

  it('handles Pacific timezone (behind UTC)', () => {
    // Mock a time that is 02:00 UTC on 2026-03-14 — still March 13 in LA (UTC-7 PDT)
    const mockDate = new Date('2026-03-14T02:00:00Z')
    vi.setSystemTime(mockDate)

    const utcToday = userLocalToday('UTC')
    const laToday = userLocalToday('America/Los_Angeles')

    expect(utcToday).toBe('2026-03-14')
    expect(laToday).toBe('2026-03-13')

    vi.useRealTimers()
  })
})
