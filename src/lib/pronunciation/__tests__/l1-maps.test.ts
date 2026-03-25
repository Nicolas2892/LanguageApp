import { describe, it, expect } from 'vitest'
import { L1_TIPS, PRONUNCIATION_CATEGORIES } from '../l1-maps'

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
