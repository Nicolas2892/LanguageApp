import { normalizeSpanish } from '@/lib/verbs/grader'

export type VocabGradeOutcome = 'correct' | 'accent_error' | 'incorrect'

export interface VocabGradeResult {
  outcome: VocabGradeOutcome
  userAnswer: string
  correctForm: string
  hint: string | null
}

/**
 * Grade a vocabulary drill attempt.
 * Checks against the primary correct form and any accepted variants.
 * - exact match (trimmed, case-insensitive) against any accepted form → 'correct'
 * - accent-normalized match against any accepted form → 'accent_error'
 * - otherwise → 'incorrect'
 */
export function gradeVocab(
  userAnswer: string,
  correctForm: string,
  answerVariants: string[] | null,
  hint: string | null = null,
): VocabGradeResult {
  const trimmedUser = userAnswer.trim()
  const allAccepted = [correctForm, ...(answerVariants ?? [])]

  // 1. Exact match (case-insensitive) against any accepted form
  for (const accepted of allAccepted) {
    if (trimmedUser.toLowerCase() === accepted.trim().toLowerCase()) {
      return { outcome: 'correct', userAnswer: trimmedUser, correctForm: correctForm.trim(), hint }
    }
  }

  // 2. Accent-normalized match against any accepted form
  const normalizedUser = normalizeSpanish(trimmedUser)
  for (const accepted of allAccepted) {
    if (normalizedUser === normalizeSpanish(accepted)) {
      return { outcome: 'accent_error', userAnswer: trimmedUser, correctForm: correctForm.trim(), hint }
    }
  }

  // 3. No match
  return { outcome: 'incorrect', userAnswer: trimmedUser, correctForm: correctForm.trim(), hint }
}
