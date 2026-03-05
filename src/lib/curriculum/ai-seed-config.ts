/**
 * Configuration constants for the AI-powered curriculum seed script.
 * Defines default exercise type mixes per CEFR level and generation rules per type.
 */

export type ExerciseType = 'gap_fill' | 'transformation' | 'translation' | 'error_correction' | 'free_write'
export type CefrLevel = 'B1' | 'B2' | 'C1'
export type GrammarFocus = 'indicative' | 'subjunctive' | 'both'

/** Default 3-tuple of exercise types for each CEFR level. */
export const EXERCISE_TYPE_RULES: Record<CefrLevel, [ExerciseType, ExerciseType, ExerciseType]> = {
  B1: ['gap_fill', 'transformation', 'translation'],
  B2: ['gap_fill', 'translation', 'error_correction'],
  C1: ['transformation', 'translation', 'free_write'],
}

/** Generation instructions sent to Claude for each exercise type. */
export const EXERCISE_GENERATION_RULES: Record<ExerciseType, string> = {
  gap_fill: [
    'Write 1–2 Spanish sentences with exactly 1 or 2 blanks (___).',
    'ALL blanks must test the same target concept — never place a blank for a different concept.',
    'Use 1 blank by default. Use 2 blanks only when the same concept usefully appears twice (e.g. two subjunctive conjugations, two positions of the same connector).',
    'For 1 blank: "expected_answer" is a plain string, e.g. "sin embargo".',
    'For 2 blanks: "expected_answer" MUST be a JSON-encoded array string with one entry per blank in left-to-right order, e.g. \'["vengas","lleguen"]\'.',
    'Surrounding context must be rich enough that the learner must choose the target answer over plausible alternatives. Do NOT hint at the answer within the sentence.',
  ].join(' '),

  transformation: [
    'Provide a Spanish sentence pair: a base sentence and an instruction to transform it using the target concept.',
    'Format: "Base: [sentence] → Rewrite using [concept]".',
    'The transformation should require meaningful use of the target structure, not just substitution.',
    '"expected_answer" is the complete transformed sentence.',
  ].join(' '),

  translation: [
    'Provide one English sentence to be translated into Spanish using the target concept.',
    'The English sentence must be natural and clearly require the target structure in Spanish.',
    '"expected_answer" is the correct Spanish translation.',
    'Avoid overly literal English that gives away the Spanish word order.',
  ].join(' '),

  error_correction: [
    'Write a Spanish sentence containing a deliberate grammatical error related to the target concept.',
    'Enclose the erroneous sentence in "double quotes".',
    '"expected_answer" is the corrected sentence.',
    'The error should be a realistic learner mistake, not a trivial typo.',
  ].join(' '),

  free_write: [
    'Provide a short writing prompt in English that asks the learner to write 2–4 Spanish sentences using the target concept.',
    'The prompt should give a realistic communicative context (opinion, description, hypothetical scenario).',
    '"expected_answer" is a model answer demonstrating correct use of the concept.',
    'hint_1 and hint_2 should scaffold the structure without giving away the vocabulary.',
  ].join(' '),
}

/** Target number of exercises per concept per type (always 3). */
export const EXERCISES_PER_TYPE = 3

/** Total exercises per concept. */
export const EXERCISES_PER_CONCEPT = EXERCISES_PER_TYPE * 3
