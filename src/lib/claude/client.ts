import Anthropic from '@anthropic-ai/sdk'

// Single shared client instance
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const TUTOR_MODEL = 'claude-sonnet-4-20250514'
// ARCH-02: Haiku for structured grading + hints — use after validate:grading confirms ≥90% agreement
export const GRADE_MODEL = 'claude-haiku-4-5-20251001'
