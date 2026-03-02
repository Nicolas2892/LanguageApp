import Anthropic from '@anthropic-ai/sdk'

// Single shared client instance
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const TUTOR_MODEL = 'claude-sonnet-4-20250514'
