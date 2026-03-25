import { describe, it, expect } from 'vitest'
import { ROUTES } from '../routes'

describe('ROUTES', () => {
  it('exports a frozen object with string values starting with /', () => {
    expect(typeof ROUTES).toBe('object')
    for (const [key, value] of Object.entries(ROUTES)) {
      expect(typeof value).toBe('string')
      expect(value).toMatch(/^\//)
    }
  })

  it('contains all expected route keys', () => {
    const expectedKeys = [
      'login', 'signup', 'authCallback',
      'dashboard', 'study', 'studyConfigure',
      'curriculum', 'verbs', 'verbsConfigure', 'verbsSession',
      'vocabConfigure', 'vocabSession',
      'pronunciation', 'pronunciationSession',
      'progress', 'tutor', 'write', 'account', 'onboarding',
      'admin', 'adminCurriculum', 'adminExercises', 'adminPool',
      'offlineReports', 'brandPreview',
    ]
    for (const key of expectedKeys) {
      expect(ROUTES).toHaveProperty(key)
    }
    expect(Object.keys(ROUTES)).toHaveLength(expectedKeys.length)
  })

  it('has no duplicate values', () => {
    const values = Object.values(ROUTES)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })
})
