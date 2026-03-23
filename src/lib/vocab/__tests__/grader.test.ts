import { describe, it, expect } from 'vitest'
import { gradeVocab } from '../grader'

describe('gradeVocab', () => {
  it('returns correct for exact match', () => {
    const result = gradeVocab('sin embargo', 'sin embargo', null)
    expect(result.outcome).toBe('correct')
    expect(result.correctForm).toBe('sin embargo')
  })

  it('returns correct for case-insensitive match', () => {
    const result = gradeVocab('Sin Embargo', 'sin embargo', null)
    expect(result.outcome).toBe('correct')
  })

  it('returns correct for match with leading/trailing spaces', () => {
    const result = gradeVocab('  sin embargo  ', 'sin embargo', null)
    expect(result.outcome).toBe('correct')
  })

  it('returns correct when matching an answer variant', () => {
    const result = gradeVocab('no obstante', 'sin embargo', ['no obstante', 'aun así'])
    expect(result.outcome).toBe('correct')
  })

  it('returns correct for case-insensitive variant match', () => {
    const result = gradeVocab('Aun Así', 'sin embargo', ['no obstante', 'aun así'])
    expect(result.outcome).toBe('correct')
  })

  it('returns accent_error when only accent differs on primary form', () => {
    const result = gradeVocab('ademas', 'además', null)
    expect(result.outcome).toBe('accent_error')
  })

  it('returns accent_error when only accent differs on a variant', () => {
    const result = gradeVocab('aun asi', 'sin embargo', ['no obstante', 'aún así'])
    expect(result.outcome).toBe('accent_error')
  })

  it('returns incorrect for wrong answer', () => {
    const result = gradeVocab('por lo tanto', 'sin embargo', null)
    expect(result.outcome).toBe('incorrect')
  })

  it('returns incorrect for empty answer after trim', () => {
    const result = gradeVocab('   ', 'sin embargo', null)
    expect(result.outcome).toBe('incorrect')
  })

  it('returns trimmed userAnswer in result', () => {
    const result = gradeVocab('  sin embargo  ', 'sin embargo', null)
    expect(result.userAnswer).toBe('sin embargo')
  })

  it('returns trimmed correctForm in result', () => {
    const result = gradeVocab('test', '  sin embargo  ', null)
    expect(result.correctForm).toBe('sin embargo')
  })

  it('passes through hint in result', () => {
    const result = gradeVocab('sin embargo', 'sin embargo', null, 'however')
    expect(result.hint).toBe('however')
  })

  it('returns null hint when not provided', () => {
    const result = gradeVocab('sin embargo', 'sin embargo', null)
    expect(result.hint).toBeNull()
  })

  it('prefers exact match over accent match on variant', () => {
    // "aun asi" exact-matches variant "aun asi" before accent-matching "aún así"
    const result = gradeVocab('aun asi', 'sin embargo', ['aun asi', 'aún así'])
    expect(result.outcome).toBe('correct')
  })

  it('handles multi-word expressions with accents', () => {
    const result = gradeVocab('a pesar de ello', 'a pesar de ello', null)
    expect(result.outcome).toBe('correct')
  })

  it('handles variant with extra whitespace in definition', () => {
    const result = gradeVocab('no obstante', 'sin embargo', ['  no obstante  '])
    expect(result.outcome).toBe('correct')
  })
})
