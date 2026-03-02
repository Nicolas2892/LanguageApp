import { describe, it, expect } from 'vitest'

// Extracted from route.ts — pure logic tested in isolation
function scoreToInterval(score: number): number {
  if (score >= 3) return 14
  if (score >= 2) return 6
  if (score >= 1) return 2
  return 1
}

describe('scoreToInterval', () => {
  it('score 3 → 14 days (near-mastered)', () => {
    expect(scoreToInterval(3)).toBe(14)
  })

  it('score 2 → 6 days (known)', () => {
    expect(scoreToInterval(2)).toBe(6)
  })

  it('score 1 → 2 days (shaky)', () => {
    expect(scoreToInterval(1)).toBe(2)
  })

  it('score 0 → 1 day (unknown — due tomorrow)', () => {
    expect(scoreToInterval(0)).toBe(1)
  })

  it('fractional scores round down correctly', () => {
    // Claude returns integer scores, but just in case
    expect(scoreToInterval(2.9)).toBe(6)
    expect(scoreToInterval(1.5)).toBe(2)
  })
})
