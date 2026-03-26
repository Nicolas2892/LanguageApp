import { describe, it, expect } from 'vitest'
import { verbOutcomeToSRS, vocabOutcomeToSRS } from '../scoreMapping'

describe('verbOutcomeToSRS', () => {
  it('maps correct to 3', () => {
    expect(verbOutcomeToSRS('correct')).toBe(3)
  })

  it('maps accent_error to 2', () => {
    expect(verbOutcomeToSRS('accent_error')).toBe(2)
  })

  it('maps incorrect to 0', () => {
    expect(verbOutcomeToSRS('incorrect')).toBe(0)
  })
})

describe('vocabOutcomeToSRS', () => {
  it('maps correct to 3', () => {
    expect(vocabOutcomeToSRS('correct')).toBe(3)
  })

  it('maps accent_error to 2', () => {
    expect(vocabOutcomeToSRS('accent_error')).toBe(2)
  })

  it('maps incorrect to 0', () => {
    expect(vocabOutcomeToSRS('incorrect')).toBe(0)
  })
})
