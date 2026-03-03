export const BLANK_TOKEN = '___'

/** Split a prompt string on BLANK_TOKEN separators. */
export function splitPromptOnBlanks(prompt: string): string[] {
  return prompt.split(BLANK_TOKEN)
}

/** Count how many blanks exist in a prompt string. */
export function countBlanks(prompt: string): number {
  return prompt.split(BLANK_TOKEN).length - 1
}

/**
 * Parse expected_answer as a JSON string[] if it is a multi-blank array.
 * Returns null for single-blank plain strings, legacy formats, or null input.
 */
export function parseExpectedAnswers(raw: string | null): string[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed
    }
  } catch {
    // single-blank plain string — not JSON
  }
  return null
}

/** Encode multiple blank answers as a pipe-delimited string for submission. */
export function encodeAnswers(answers: string[]): string {
  return answers.join(' | ')
}
