import { describe, it, expect } from 'vitest'
import { normalizeSpanish, gradeConjugation } from '../grader'

describe('normalizeSpanish', () => {
  it('lowercases input', () => {
    expect(normalizeSpanish('HABLÓ')).toBe('hablo')
  })

  it('strips combining diacritics', () => {
    expect(normalizeSpanish('él')).toBe('el')
    expect(normalizeSpanish('habló')).toBe('hablo')
    expect(normalizeSpanish('hablé')).toBe('hable')
    expect(normalizeSpanish('hablarán')).toBe('hablaran')
  })

  it('trims whitespace', () => {
    expect(normalizeSpanish('  fui  ')).toBe('fui')
  })
})

describe('gradeConjugation', () => {
  const rule = 'test rule'

  it('returns correct for exact match', () => {
    const result = gradeConjugation('fui', 'fui', rule)
    expect(result.outcome).toBe('correct')
    expect(result.correctForm).toBe('fui')
  })

  it('returns correct for case-insensitive match', () => {
    const result = gradeConjugation('FUI', 'fui', rule)
    expect(result.outcome).toBe('correct')
  })

  it('returns correct for match with leading/trailing spaces', () => {
    const result = gradeConjugation('  fui  ', 'fui', rule)
    expect(result.outcome).toBe('correct')
  })

  it('returns accent_error when only accent differs', () => {
    const result = gradeConjugation('hablo', 'habló', rule)
    expect(result.outcome).toBe('accent_error')
  })

  it('returns accent_error for missing tilde on n', () => {
    const result = gradeConjugation('hablaran', 'hablarán', rule)
    expect(result.outcome).toBe('accent_error')
  })

  it('returns incorrect for wrong form', () => {
    const result = gradeConjugation('habla', 'fui', rule)
    expect(result.outcome).toBe('incorrect')
  })

  it('returns incorrect for empty answer after trim', () => {
    const result = gradeConjugation('', 'fui', rule)
    expect(result.outcome).toBe('incorrect')
  })

  it('returns tenseRule in result', () => {
    const result = gradeConjugation('fui', 'fui', rule)
    expect(result.tenseRule).toBe(rule)
  })

  it('returns the trimmed userAnswer in result', () => {
    const result = gradeConjugation('  hablo  ', 'habló', rule)
    expect(result.userAnswer).toBe('hablo')
  })

  it('returns the trimmed correctForm in result', () => {
    const result = gradeConjugation('hablo', '  habló  ', rule)
    expect(result.correctForm).toBe('habló')
  })
})
