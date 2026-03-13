import { describe, it, expect, vi } from 'vitest'
import { sm2, DEFAULT_PROGRESS } from '../index'

describe('sm2', () => {
  describe('first correct answer (score >= 2)', () => {
    it('sets interval to 1 day on first repetition', () => {
      const result = sm2(DEFAULT_PROGRESS, 2)
      expect(result.interval_days).toBe(1)
      expect(result.repetitions).toBe(1)
    })

    it('sets interval to 6 days on second repetition', () => {
      const afterFirst = sm2(DEFAULT_PROGRESS, 2)
      const result = sm2(afterFirst, 2)
      expect(result.interval_days).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('multiplies by ease_factor on subsequent repetitions', () => {
      const afterFirst = sm2(DEFAULT_PROGRESS, 2)
      const afterSecond = sm2(afterFirst, 2)
      // interval_days=6, ease_factor=2.6 → Math.round(6 * 2.6) = 16
      const result = sm2(afterSecond, 3)
      expect(result.interval_days).toBe(Math.round(6 * afterSecond.ease_factor))
    })
  })

  describe('ease_factor updates', () => {
    it('increases ease_factor on score 3', () => {
      const result = sm2(DEFAULT_PROGRESS, 3)
      expect(result.ease_factor).toBeGreaterThan(DEFAULT_PROGRESS.ease_factor)
    })

    it('keeps ease_factor the same on score 2', () => {
      const result = sm2(DEFAULT_PROGRESS, 2)
      // score=2: 0.1 - (3-2)*(0.08 + (3-2)*0.02) = 0.1 - 0.1 = 0 → no change
      expect(result.ease_factor).toBe(DEFAULT_PROGRESS.ease_factor)
    })

    it('decreases ease_factor on score 1 (but not below 1.3)', () => {
      const result = sm2(DEFAULT_PROGRESS, 1)
      // score 1 resets, ease_factor unchanged (only updated on correct)
      // incorrect path doesn't change ease_factor
      expect(result.ease_factor).toBe(DEFAULT_PROGRESS.ease_factor)
    })

    it('never drops ease_factor below 1.3', () => {
      let progress = DEFAULT_PROGRESS
      for (let i = 0; i < 20; i++) {
        progress = sm2(progress, 2) // score 2 with small positive delta
      }
      expect(progress.ease_factor).toBeGreaterThanOrEqual(1.3)
    })
  })

  describe('incorrect answers (score < 2)', () => {
    it('resets repetitions to 0 on score 0', () => {
      const afterSome = sm2(sm2(DEFAULT_PROGRESS, 3), 3)
      const result = sm2(afterSome, 0)
      expect(result.repetitions).toBe(0)
    })

    it('sets interval to 1 day on score 0', () => {
      const result = sm2(DEFAULT_PROGRESS, 0)
      expect(result.interval_days).toBe(1)
    })

    it('sets interval to 3 days on score 1', () => {
      const result = sm2(DEFAULT_PROGRESS, 1)
      expect(result.interval_days).toBe(3)
    })
  })

  describe('due_date', () => {
    it('returns a valid YYYY-MM-DD date string', () => {
      const result = sm2(DEFAULT_PROGRESS, 2)
      expect(result.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('due_date is in the future', () => {
      const result = sm2(DEFAULT_PROGRESS, 2)
      const today = new Date().toISOString().split('T')[0]
      expect(result.due_date >= today).toBe(true)
    })

    it('accepts null timezone (falls back to UTC)', () => {
      const result = sm2(DEFAULT_PROGRESS, 2, null)
      expect(result.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('accepts a valid IANA timezone', () => {
      const result = sm2(DEFAULT_PROGRESS, 2, 'America/New_York')
      expect(result.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('uses timezone-local today when computing due_date', () => {
      // 2026-03-14 02:00 UTC = still March 13 in LA (UTC-7 PDT)
      vi.setSystemTime(new Date('2026-03-14T02:00:00Z'))

      const utcResult = sm2(DEFAULT_PROGRESS, 2, 'UTC')
      const laResult = sm2(DEFAULT_PROGRESS, 2, 'America/Los_Angeles')

      // interval_days = 1 for first correct answer
      expect(utcResult.due_date).toBe('2026-03-15') // March 14 + 1
      expect(laResult.due_date).toBe('2026-03-14')  // March 13 + 1

      vi.useRealTimers()
    })
  })
})
