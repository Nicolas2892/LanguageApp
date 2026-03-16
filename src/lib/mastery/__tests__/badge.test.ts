import { describe, it, expect } from 'vitest'
import {
  getMasteryState,
  getMasteryProgress,
  PRODUCTION_CORRECT_REQUIRED,
  PRODUCTION_TYPES_REQUIRED,
} from '../badge'

describe('getMasteryState', () => {
  it('returns "new" when intervalDays is undefined', () => {
    expect(getMasteryState(undefined)).toBe('new')
  })

  it('returns "learning" when intervalDays < 21', () => {
    expect(getMasteryState(10)).toBe('learning')
  })

  it('returns "mastered" when intervalDays >= 21 and no production flag provided', () => {
    expect(getMasteryState(21)).toBe('mastered')
    expect(getMasteryState(30)).toBe('mastered')
  })

  it('returns "mastered" when intervalDays >= 21 and productionMastered is true', () => {
    expect(getMasteryState(21, true)).toBe('mastered')
  })

  it('returns "learning" when intervalDays >= 21 but productionMastered is false', () => {
    expect(getMasteryState(21, false)).toBe('learning')
    expect(getMasteryState(30, false)).toBe('learning')
  })

  it('returns "learning" when intervalDays < 21 regardless of production flag', () => {
    expect(getMasteryState(10, true)).toBe('learning')
    expect(getMasteryState(10, false)).toBe('learning')
  })
})

describe('getMasteryProgress', () => {
  it('returns all false when no progress exists', () => {
    const result = getMasteryProgress(undefined, 0, 0)
    expect(result).toEqual({
      srsReady: false,
      correctNonGapFill: 0,
      uniqueTypes: 0,
      productionReady: false,
      mastered: false,
    })
  })

  it('returns srsReady when intervalDays >= 21', () => {
    const result = getMasteryProgress(21, 0, 0)
    expect(result.srsReady).toBe(true)
    expect(result.mastered).toBe(false) // no production
  })

  it('returns productionReady when >= 3 correct and >= 2 types', () => {
    const result = getMasteryProgress(10, 3, 2)
    expect(result.productionReady).toBe(true)
    expect(result.mastered).toBe(false) // SRS not ready
  })

  it('returns mastered when both gates are met', () => {
    const result = getMasteryProgress(21, 3, 2)
    expect(result.mastered).toBe(true)
    expect(result.srsReady).toBe(true)
    expect(result.productionReady).toBe(true)
  })

  it('caps correctNonGapFill at PRODUCTION_CORRECT_REQUIRED', () => {
    const result = getMasteryProgress(21, 10, 3)
    expect(result.correctNonGapFill).toBe(PRODUCTION_CORRECT_REQUIRED)
  })

  it('caps uniqueTypes at PRODUCTION_TYPES_REQUIRED', () => {
    const result = getMasteryProgress(21, 5, 5)
    expect(result.uniqueTypes).toBe(PRODUCTION_TYPES_REQUIRED)
  })

  it('requires exactly 3 correct — 2 is not enough', () => {
    const result = getMasteryProgress(21, 2, 2)
    expect(result.productionReady).toBe(false)
    expect(result.mastered).toBe(false)
  })

  it('requires 2 types — 1 type with 3 correct is not enough', () => {
    const result = getMasteryProgress(21, 3, 1)
    expect(result.productionReady).toBe(false)
    expect(result.mastered).toBe(false)
  })

  it('handles exact threshold boundaries', () => {
    expect(getMasteryProgress(20, 3, 2).srsReady).toBe(false)
    expect(getMasteryProgress(21, 3, 2).srsReady).toBe(true)
    expect(getMasteryProgress(21, 2, 2).productionReady).toBe(false)
    expect(getMasteryProgress(21, 3, 1).productionReady).toBe(false)
    expect(getMasteryProgress(21, 3, 2).productionReady).toBe(true)
  })
})
