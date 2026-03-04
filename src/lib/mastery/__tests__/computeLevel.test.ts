import { describe, it, expect } from 'vitest'
import { computeLevel } from '../computeLevel'

describe('computeLevel', () => {
  // --- B1 (default) ---

  it('returns B1 when nothing is mastered', () => {
    expect(computeLevel({}, { B1: 6, B2: 12, C1: 3 })).toBe('B1')
  })

  it('returns B1 when B1 mastery is below 70%', () => {
    // 4 of 6 B1 = 66.7%
    expect(computeLevel({ B1: 4 }, { B1: 6, B2: 12, C1: 3 })).toBe('B1')
  })

  it('returns B1 when no concepts exist at any level', () => {
    expect(computeLevel({}, {})).toBe('B1')
  })

  it('returns B1 when only B2 mastery is high but B1 is low', () => {
    // B1: 0/6 = 0%, B2: 12/12 = 100% — still B1 because B1 threshold not met
    expect(computeLevel({ B2: 12 }, { B1: 6, B2: 12, C1: 3 })).toBe('B1')
  })

  it('returns B1 at exactly 69% B1 mastery (just below threshold)', () => {
    // 69/100 B1 mastered — 69%
    expect(computeLevel({ B1: 69 }, { B1: 100, B2: 12, C1: 3 })).toBe('B1')
  })

  // --- B2 ---

  it('returns B2 when exactly 70% of B1 concepts are mastered', () => {
    // 70/100 = 70%
    expect(computeLevel({ B1: 70 }, { B1: 100, B2: 12, C1: 3 })).toBe('B2')
  })

  it('returns B2 when all B1 concepts are mastered but B2 is low', () => {
    // B1: 6/6 = 100%, B2: 5/12 = 41.7%
    expect(computeLevel({ B1: 6, B2: 5 }, { B1: 6, B2: 12, C1: 3 })).toBe('B2')
  })

  it('returns B2 when 5 of 6 B1 mastered (real-world threshold)', () => {
    // 5/6 = 83.3%
    expect(computeLevel({ B1: 5 }, { B1: 6, B2: 12, C1: 3 })).toBe('B2')
  })

  it('returns B2 when B1 is met but B2 is exactly 59% (just below C1 threshold)', () => {
    // B1: 6/6, B2: 59/100 = 59%
    expect(computeLevel({ B1: 6, B2: 59 }, { B1: 6, B2: 100, C1: 3 })).toBe('B2')
  })

  it('returns B2 when no B2 concepts exist but B1 threshold is met', () => {
    // Edge case: no B2 content yet — pct returns 0, so C1 not unlocked
    expect(computeLevel({ B1: 6 }, { B1: 6 })).toBe('B2')
  })

  // --- C1 ---

  it('returns C1 when both B1 >= 70% and B2 >= 60% are met', () => {
    // B1: 6/6 = 100%, B2: 8/12 = 66.7%
    expect(computeLevel({ B1: 6, B2: 8 }, { B1: 6, B2: 12, C1: 3 })).toBe('C1')
  })

  it('returns C1 at exactly the dual threshold (70% B1, 60% B2)', () => {
    // B1: 70/100 = 70%, B2: 60/100 = 60%
    expect(computeLevel({ B1: 70, B2: 60 }, { B1: 100, B2: 100, C1: 3 })).toBe('C1')
  })

  it('returns C1 when all concepts at all levels are mastered', () => {
    expect(computeLevel({ B1: 6, B2: 12, C1: 3 }, { B1: 6, B2: 12, C1: 3 })).toBe('C1')
  })

  // --- Edge cases ---

  it('treats missing masteredByLevel keys as 0', () => {
    // B1 total 6, mastered undefined → 0%
    expect(computeLevel({}, { B1: 6 })).toBe('B1')
  })

  it('treats missing totalByLevel keys as 0 (returns 0% for that level)', () => {
    // No B1 total → pct('B1') = 0 → B1 result
    expect(computeLevel({ B1: 10 }, {})).toBe('B1')
  })

  it('is not affected by C1 mastery count alone', () => {
    // High C1 mastery with low B1 should still be B1
    expect(computeLevel({ C1: 3 }, { B1: 6, B2: 12, C1: 3 })).toBe('B1')
  })
})
