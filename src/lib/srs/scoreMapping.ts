import type { SRSScore } from '@/lib/srs'

export type VerbGradeOutcome = 'correct' | 'accent_error' | 'incorrect'
export type VocabGradeOutcome = 'correct' | 'accent_error' | 'incorrect'

/** Map verb grading outcome to SRS score (0-3). */
export function verbOutcomeToSRS(outcome: VerbGradeOutcome): SRSScore {
  switch (outcome) {
    case 'correct': return 3
    case 'accent_error': return 2
    case 'incorrect': return 0
  }
}

/** Map vocab grading outcome to SRS score (0-3). */
export function vocabOutcomeToSRS(outcome: VocabGradeOutcome): SRSScore {
  switch (outcome) {
    case 'correct': return 3
    case 'accent_error': return 2
    case 'incorrect': return 0
  }
}
