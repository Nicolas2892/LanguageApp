import { describe, it, expect } from 'vitest'
import { VOCAB_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_LEVELS } from '../constants'

describe('vocab constants', () => {
  it('has 8 categories', () => {
    expect(VOCAB_CATEGORIES).toHaveLength(8)
  })

  it('every category has a label', () => {
    for (const cat of VOCAB_CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeDefined()
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
    }
  })

  it('every category has a description', () => {
    for (const cat of VOCAB_CATEGORIES) {
      expect(CATEGORY_DESCRIPTIONS[cat]).toBeDefined()
      expect(CATEGORY_DESCRIPTIONS[cat].length).toBeGreaterThan(0)
    }
  })

  it('every category has a level range', () => {
    for (const cat of VOCAB_CATEGORIES) {
      expect(CATEGORY_LEVELS[cat]).toBeDefined()
      expect(CATEGORY_LEVELS[cat]).toMatch(/^[BC][12](–[BC][12])?$/)
    }
  })

  it('categories are unique', () => {
    const unique = new Set(VOCAB_CATEGORIES)
    expect(unique.size).toBe(VOCAB_CATEGORIES.length)
  })
})
