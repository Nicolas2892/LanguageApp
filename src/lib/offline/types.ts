/**
 * Offline storage types — structurally compatible with Supabase row types
 * but decoupled for IDB usage.
 */

// ── Module download metadata ──────────────────────────────────────────

export interface DownloadedModule {
  module_id: string
  title: string
  order_index: number
  downloaded_at: string          // ISO datetime
  exercise_count: number
  concept_count: number
  version: number                // server timestamp for staleness
}

// ── Cached curriculum rows ────────────────────────────────────────────

export interface OfflineExercise {
  id: string
  concept_id: string
  module_id: string              // denormalised for IDB index
  type: string
  prompt: string
  expected_answer: string | null
  answer_variants: string[] | null
  hint_1: string | null
  hint_2: string | null
  annotations: unknown | null
  source: 'seed' | 'ai_generated'
}

export interface OfflineConcept {
  id: string
  module_id: string              // denormalised
  unit_id: string
  type: string
  title: string
  explanation: string
  examples: unknown
  difficulty: number
  level: string
  grammar_focus: string | null
}

export interface OfflineUnit {
  id: string
  module_id: string
  title: string
  order_index: number
}

// ── User progress snapshot ────────────────────────────────────────────

export interface OfflineUserProgress {
  concept_id: string
  ease_factor: number
  interval_days: number
  due_date: string
  repetitions: number
  production_mastered: boolean
  is_hard: boolean
}

// ── Pre-generated free-write prompts ──────────────────────────────────

export interface OfflineFreeWritePrompt {
  concept_id: string
  prompt: string
}

// ── Queued grammar attempts ───────────────────────────────────────────

export interface QueuedAttempt {
  id?: number                    // auto-increment
  session_id: string
  exercise_id: string | null
  concept_id: string
  concept_title: string
  exercise_type: string
  exercise_prompt: string
  user_answer: string
  expected_answer: string | null
  answer_variants: string[] | null
  attempted_at: string           // ISO datetime
  synced: 0 | 1                  // 0 = pending, 1 = synced (IDB can't index booleans)
}

// ── Queued verb attempts ──────────────────────────────────────────────

export interface QueuedVerbAttempt {
  id?: number
  verb_id: string
  tense: string
  correct: boolean
  attempted_at: string
  synced: 0 | 1
}

// ── Offline session metadata ──────────────────────────────────────────

export interface OfflineSession {
  id: string
  started_at: string
  ended_at: string | null
  exercise_count: number
  module_id: string | null       // null = cross-module SRS queue
  synced: 0 | 1
}

// ── Verb cache types ──────────────────────────────────────────────────

export interface CachedVerb {
  id: string
  infinitive: string
  english: string
  frequency_rank: number
  verb_group: string
}

export interface CachedVerbSentence {
  id: string
  verb_id: string
  tense: string
  pronoun: string
  sentence: string
  correct_form: string
  tense_rule: string
}

export interface CachedVerbConjugation {
  verb_id: string
  tense: string
  stem: string
  yo: string
  tu: string
  el: string
  nosotros: string
  vosotros: string
  ellos: string
}

export interface CachedVerbFavorite {
  verb_id: string
}

export interface CachedVerbProgress {
  verb_id: string
  tense: string
  attempt_count: number
  correct_count: number
}

export interface VerbCacheMeta {
  key: string                    // e.g. 'version', 'user_id'
  value: string
}
