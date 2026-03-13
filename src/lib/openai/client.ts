import OpenAI from 'openai'

// Single shared client instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
