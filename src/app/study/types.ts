import type { Concept, Exercise, Verb, VerbSentence, VocabItem, VocabSentence } from '@/lib/supabase/types'

/** Discriminated union for items in the unified SRS study session. */
export type UnifiedStudyItem =
  | { type: 'concept'; concept: Concept; exercise: Exercise }
  | { type: 'verb'; verb: Verb; sentence: VerbSentence; verbId: string; tense: string }
  | { type: 'vocab'; vocabItem: VocabItem; sentence: VocabSentence; vocabId: string }
