import { describe, it, expect } from 'vitest'
import { TENSES, CONJUGATION_TENSES, TENSE_LABELS, TENSE_DESCRIPTIONS } from '../constants'
import type { VerbTense } from '../constants'

describe('TENSES', () => {
  it('includes all 9 conjugation tenses plus infinitive', () => {
    expect(TENSES).toHaveLength(10)
    expect(TENSES).toContain('infinitive')
  })

  it('includes the original 9 conjugation tenses', () => {
    const expected = [
      'present_indicative',
      'preterite',
      'imperfect',
      'future',
      'conditional',
      'present_subjunctive',
      'imperfect_subjunctive',
      'imperative_affirmative',
      'imperative_negative',
    ]
    for (const t of expected) {
      expect(TENSES).toContain(t)
    }
  })
})

describe('CONJUGATION_TENSES', () => {
  it('contains 9 tenses (excludes infinitive)', () => {
    expect(CONJUGATION_TENSES).toHaveLength(9)
    expect(CONJUGATION_TENSES).not.toContain('infinitive')
  })
})

describe('TENSE_LABELS', () => {
  it('has a label for every tense including infinitive', () => {
    for (const tense of TENSES) {
      expect(TENSE_LABELS[tense]).toBeDefined()
      expect(TENSE_LABELS[tense].length).toBeGreaterThan(0)
    }
  })

  it('maps infinitive to Infinitivo', () => {
    expect(TENSE_LABELS.infinitive).toBe('Infinitivo')
  })
})

describe('TENSE_DESCRIPTIONS', () => {
  it('has a description for every tense including infinitive', () => {
    for (const tense of TENSES) {
      expect(TENSE_DESCRIPTIONS[tense]).toBeDefined()
      expect(TENSE_DESCRIPTIONS[tense].length).toBeGreaterThan(0)
    }
  })

  it('infinitive description mentions English meaning', () => {
    expect(TENSE_DESCRIPTIONS.infinitive).toMatch(/English/)
  })
})

describe('VerbTense type', () => {
  it('accepts infinitive as a valid tense', () => {
    const tense: VerbTense = 'infinitive'
    expect(TENSES).toContain(tense)
  })
})
