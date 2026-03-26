import { describe, it, expect } from 'vitest'
import { L1_TIPS, PRONUNCIATION_CATEGORIES, classifyPhoneme } from '../l1-maps'

describe('L1 interference maps', () => {
  it('has tips for both German and English', () => {
    expect(L1_TIPS.german).toBeDefined()
    expect(L1_TIPS.english).toBeDefined()
  })

  it('covers all pronunciation categories for German', () => {
    for (const cat of PRONUNCIATION_CATEGORIES) {
      expect(L1_TIPS.german[cat]).toBeDefined()
      expect(L1_TIPS.german[cat].description.length).toBeGreaterThan(0)
      expect(L1_TIPS.german[cat].tip.length).toBeGreaterThan(0)
    }
  })

  it('covers all pronunciation categories for English', () => {
    for (const cat of PRONUNCIATION_CATEGORIES) {
      expect(L1_TIPS.english[cat]).toBeDefined()
      expect(L1_TIPS.english[cat].description.length).toBeGreaterThan(0)
      expect(L1_TIPS.english[cat].tip.length).toBeGreaterThan(0)
    }
  })

  it('has no empty string values in any tip', () => {
    for (const lang of Object.keys(L1_TIPS)) {
      for (const cat of Object.keys(L1_TIPS[lang])) {
        const entry = L1_TIPS[lang][cat]
        expect(entry.description).not.toBe('')
        expect(entry.tip).not.toBe('')
      }
    }
  })

  it('exports the expected number of categories', () => {
    expect(PRONUNCIATION_CATEGORIES).toHaveLength(8)
  })
})

describe('classifyPhoneme', () => {
  it('returns null for empty phonemes', () => {
    expect(classifyPhoneme({ phonemes: [] })).toBeNull()
  })

  it('classifies r-like phonemes as rr', () => {
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'r', score: 30 }] })).toBe('rr')
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'ɾ', score: 40 }] })).toBe('rr')
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'ɹ', score: 50 }] })).toBe('rr')
  })

  it('classifies x-like phonemes as x', () => {
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'x', score: 30 }] })).toBe('x')
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'χ', score: 40 }] })).toBe('x')
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'h', score: 50 }] })).toBe('x')
  })

  it('classifies palatal nasal as ɲ', () => {
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'ɲ', score: 30 }] })).toBe('ɲ')
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'ñ', score: 40 }] })).toBe('ɲ')
  })

  it('classifies vowels', () => {
    for (const v of ['a', 'e', 'i', 'o', 'u']) {
      expect(classifyPhoneme({ phonemes: [{ phoneme: v, score: 30 }] })).toBe('vowels')
    }
  })

  it('classifies other consonants', () => {
    expect(classifyPhoneme({ phonemes: [{ phoneme: 'p', score: 30 }] })).toBe('consonants')
    expect(classifyPhoneme({ phonemes: [{ phoneme: 't', score: 40 }] })).toBe('consonants')
  })

  it('uses worst-scored phoneme when multiple exist', () => {
    const result = classifyPhoneme({
      phonemes: [
        { phoneme: 'p', score: 80 },
        { phoneme: 'r', score: 20 },
        { phoneme: 'a', score: 60 },
      ],
    })
    expect(result).toBe('rr')
  })
})
