import {
  getAllExercises,
  getExercisesByModule,
  getAllConcepts,
  getConceptsByModule,
  getAllUserProgress,
} from './db'
import type { OfflineExercise, OfflineConcept, OfflineUserProgress } from './types'
import type { StudyItem } from '@/lib/studyUtils'
import type { Concept, Exercise } from '@/lib/supabase/types'
import { SESSION_SIZE } from '@/lib/constants'

/**
 * Build a queue of exercises for offline study.
 *
 * - Default (SRS mode): picks due concepts across all downloaded modules
 * - Module filter: restricts to one module
 * - Falls back to open-practice style if no SRS-due items
 */
export async function buildOfflineQueue(options?: {
  moduleId?: string
  today?: string
}): Promise<StudyItem[]> {
  const today = options?.today ?? new Date().toISOString().split('T')[0]

  // Fetch data from IDB
  const [exercises, concepts, progress] = await Promise.all([
    options?.moduleId
      ? getExercisesByModule(options.moduleId)
      : getAllExercises(),
    options?.moduleId
      ? getConceptsByModule(options.moduleId)
      : getAllConcepts(),
    getAllUserProgress(),
  ])

  if (exercises.length === 0 || concepts.length === 0) return []

  const conceptMap = new Map(concepts.map(c => [c.id, c]))
  const progressMap = new Map(progress.map(p => [p.concept_id, p]))

  // Group exercises by concept
  const exercisesByConcept = new Map<string, OfflineExercise[]>()
  for (const ex of exercises) {
    const arr = exercisesByConcept.get(ex.concept_id) ?? []
    arr.push(ex)
    exercisesByConcept.set(ex.concept_id, arr)
  }

  // Find due concepts
  const dueConcepts = concepts.filter(c => {
    const p = progressMap.get(c.id)
    if (!p) return true  // never seen = due
    return p.due_date <= today
  })

  const targetConcepts = dueConcepts.length > 0 ? dueConcepts : concepts

  // Build queue: one exercise per concept, up to SESSION_SIZE
  const queue: StudyItem[] = []
  const shuffled = shuffle(targetConcepts)

  for (const concept of shuffled) {
    if (queue.length >= SESSION_SIZE) break
    const conceptExercises = exercisesByConcept.get(concept.id)
    if (!conceptExercises || conceptExercises.length === 0) continue

    // Pick a random exercise, biased away from gap_fill
    const exercise = biasedPick(conceptExercises)
    queue.push({
      concept: toSupabaseConcept(concept),
      exercise: toSupabaseExercise(exercise),
    })
  }

  return queue
}

function biasedPick(exercises: OfflineExercise[]): OfflineExercise {
  if (exercises.length <= 1) return exercises[0]

  // 80% chance to exclude gap_fill
  if (Math.random() < 0.8) {
    const nonGap = exercises.filter(e => e.type !== 'gap_fill')
    if (nonGap.length > 0) {
      return nonGap[Math.floor(Math.random() * nonGap.length)]
    }
  }

  return exercises[Math.floor(Math.random() * exercises.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Convert offline types to Supabase row types for StudyItem compatibility
function toSupabaseConcept(c: OfflineConcept): Concept {
  return {
    id: c.id,
    unit_id: c.unit_id,
    type: c.type,
    title: c.title,
    explanation: c.explanation,
    examples: c.examples as Concept['examples'],
    difficulty: c.difficulty,
    level: c.level,
    grammar_focus: c.grammar_focus,
    created_at: '',
  }
}

function toSupabaseExercise(e: OfflineExercise): Exercise {
  return {
    id: e.id,
    concept_id: e.concept_id,
    type: e.type,
    prompt: e.prompt,
    expected_answer: e.expected_answer,
    answer_variants: e.answer_variants,
    hint_1: e.hint_1,
    hint_2: e.hint_2,
    annotations: e.annotations as Exercise['annotations'],
    source: e.source,
    created_at: '',
  }
}
