export type VerbGradeOutcome = 'correct' | 'accent_error' | 'incorrect'

export interface VerbGradeResult {
  outcome: VerbGradeOutcome
  userAnswer: string
  correctForm: string
  tenseRule: string
}

/**
 * Normalise a Spanish string for accent-insensitive comparison:
 * trim, lowercase, decompose diacritics, strip combining marks.
 */
export function normalizeSpanish(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Grade a conjugation attempt.
 * - exact match (trimmed, case-insensitive) → 'correct'
 * - match after normalizeSpanish → 'accent_error'
 * - otherwise → 'incorrect'
 */
export function gradeConjugation(
  userAnswer: string,
  correctForm: string,
  tenseRule: string,
): VerbGradeResult {
  const trimmedUser = userAnswer.trim()
  const trimmedCorrect = correctForm.trim()

  // Exact match (case-insensitive)
  if (trimmedUser.toLowerCase() === trimmedCorrect.toLowerCase()) {
    return { outcome: 'correct', userAnswer: trimmedUser, correctForm: trimmedCorrect, tenseRule }
  }

  // Accent-normalised match
  if (normalizeSpanish(trimmedUser) === normalizeSpanish(trimmedCorrect)) {
    return { outcome: 'accent_error', userAnswer: trimmedUser, correctForm: trimmedCorrect, tenseRule }
  }

  return { outcome: 'incorrect', userAnswer: trimmedUser, correctForm: trimmedCorrect, tenseRule }
}
