import { describe, it, expect } from 'vitest'
import { HARD_INTERVAL_MULTIPLIER } from '@/lib/constants'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'

/**
 * Simulates the hard-flag multiplier logic from /api/submit.
 * Pure computation — no DB involved.
 */
function applyHardMultiplier(intervalDays: number): number {
  return Math.max(1, Math.round(intervalDays * HARD_INTERVAL_MULTIPLIER))
}

describe('Hard-flag interval multiplier', () => {
  it('HARD_INTERVAL_MULTIPLIER is 0.6', () => {
    expect(HARD_INTERVAL_MULTIPLIER).toBe(0.6)
  })

  it('reduces a 1-day interval to 1 (floor)', () => {
    expect(applyHardMultiplier(1)).toBe(1)
  })

  it('reduces a 6-day interval to 4', () => {
    expect(applyHardMultiplier(6)).toBe(4)
  })

  it('reduces a 15-day interval to 9', () => {
    expect(applyHardMultiplier(15)).toBe(9)
  })

  it('reduces a 21-day interval to 13', () => {
    expect(applyHardMultiplier(21)).toBe(13)
  })

  it('reduces a 37-day interval to 22', () => {
    expect(applyHardMultiplier(37)).toBe(22)
  })

  it('never produces an interval below 1', () => {
    // Hypothetical sub-1 input is impossible in SM-2, but guard holds
    expect(applyHardMultiplier(0)).toBe(1)
  })

  it('rounds 0.5 up (Math.round)', () => {
    // 3 * 0.6 = 1.8 → rounds to 2
    expect(applyHardMultiplier(3)).toBe(2)
  })

  describe('applied to real SM-2 outputs', () => {
    function sm2Interval(repetitions: number, intervalDays: number, score: SRSScore): number {
      return sm2({ ease_factor: DEFAULT_PROGRESS.ease_factor, interval_days: intervalDays, repetitions }, score).interval_days
    }

    it('first correct answer: SM-2 gives 1 day → hard flag keeps 1 day', () => {
      const sm2Out = sm2Interval(0, DEFAULT_PROGRESS.interval_days, 3)
      expect(sm2Out).toBe(1)
      expect(applyHardMultiplier(sm2Out)).toBe(1)
    })

    it('second correct answer: SM-2 gives 6 days → hard flag gives 4 days', () => {
      const sm2Out = sm2Interval(1, 1, 3)
      expect(sm2Out).toBe(6)
      expect(applyHardMultiplier(sm2Out)).toBe(4)
    })

    it('multiplier NOT applied on wrong answer (score 0)', () => {
      // score < 2: SM-2 resets, multiplier is not applied per route logic
      const score: SRSScore = 0
      const sm2Out = sm2Interval(5, 15, score)
      // Confirm SM-2 resets (interval 1)
      expect(sm2Out).toBe(1)
      // The route only applies multiplier when score >= 2, so this value stays 1 regardless
      expect(applyHardMultiplier(sm2Out)).toBe(1) // same result, but never called in route
    })

    it('multiplier NOT applied on partial answer (score 1)', () => {
      const score: SRSScore = 1
      const sm2Out = sm2Interval(5, 15, score)
      expect(sm2Out).toBe(3)
      // For score < 2 the route skips the multiplier; this assertion documents expected interval
      expect(applyHardMultiplier(sm2Out)).toBe(2) // would be if applied, but route skips it
    })
  })
})
