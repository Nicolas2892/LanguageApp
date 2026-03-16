import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  resetDB,
  putExercises,
  putConcepts,
  putUserProgress,
} from '../db'
import { buildOfflineQueue } from '../buildOfflineQueue'
import type { OfflineExercise, OfflineConcept, OfflineUserProgress } from '../types'

beforeEach(async () => {
  await resetDB()
  const req = indexedDB.deleteDatabase('senda-offline')
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
})

function makeConcept(id: string, moduleId = 'mod-1'): OfflineConcept {
  return {
    id,
    module_id: moduleId,
    unit_id: 'unit-1',
    type: 'grammar',
    title: `Concept ${id}`,
    explanation: 'Test explanation',
    examples: [],
    difficulty: 1,
    level: 'B1',
    grammar_focus: null,
  }
}

function makeExercise(id: string, conceptId: string, moduleId = 'mod-1', type = 'translation'): OfflineExercise {
  return {
    id,
    concept_id: conceptId,
    module_id: moduleId,
    type,
    prompt: `Test prompt ${id}`,
    expected_answer: 'test',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
  }
}

function makeProgress(conceptId: string, dueDate: string): OfflineUserProgress {
  return {
    concept_id: conceptId,
    ease_factor: 2.5,
    interval_days: 1,
    due_date: dueDate,
    repetitions: 1,
    production_mastered: false,
    is_hard: false,
  }
}

describe('buildOfflineQueue', () => {
  it('returns empty array when no data', async () => {
    const queue = await buildOfflineQueue()
    expect(queue).toEqual([])
  })

  it('returns exercises for downloaded concepts', async () => {
    await putConcepts([makeConcept('c1'), makeConcept('c2')])
    await putExercises([
      makeExercise('e1', 'c1'),
      makeExercise('e2', 'c2'),
    ])

    const queue = await buildOfflineQueue()
    expect(queue.length).toBeGreaterThanOrEqual(1)
    expect(queue.length).toBeLessThanOrEqual(10)
    expect(queue[0].concept).toBeDefined()
    expect(queue[0].exercise).toBeDefined()
  })

  it('filters by module when moduleId is provided', async () => {
    await putConcepts([
      makeConcept('c1', 'mod-1'),
      makeConcept('c2', 'mod-2'),
    ])
    await putExercises([
      makeExercise('e1', 'c1', 'mod-1'),
      makeExercise('e2', 'c2', 'mod-2'),
    ])

    const queue = await buildOfflineQueue({ moduleId: 'mod-1' })
    expect(queue).toHaveLength(1)
    expect(queue[0].concept.id).toBe('c1')
  })

  it('prioritizes due concepts', async () => {
    await putConcepts([makeConcept('c1'), makeConcept('c2')])
    await putExercises([
      makeExercise('e1', 'c1'),
      makeExercise('e2', 'c2'),
    ])
    // c1 is due today, c2 is due in the future
    await putUserProgress([
      makeProgress('c1', '2026-03-15'),
      makeProgress('c2', '2026-04-01'),
    ])

    const queue = await buildOfflineQueue({ today: '2026-03-15' })
    expect(queue).toHaveLength(1)
    expect(queue[0].concept.id).toBe('c1')
  })

  it('falls back to all concepts when none are due', async () => {
    await putConcepts([makeConcept('c1')])
    await putExercises([makeExercise('e1', 'c1')])
    await putUserProgress([makeProgress('c1', '2026-04-01')])

    const queue = await buildOfflineQueue({ today: '2026-03-15' })
    // Should still return exercises (fallback to all)
    expect(queue).toHaveLength(1)
  })

  it('returns StudyItem with proper types', async () => {
    await putConcepts([makeConcept('c1')])
    await putExercises([makeExercise('e1', 'c1')])

    const queue = await buildOfflineQueue()
    const item = queue[0]

    expect(item.concept.id).toBe('c1')
    expect(item.concept.title).toBe('Concept c1')
    expect(item.exercise.id).toBe('e1')
    expect(item.exercise.type).toBe('translation')
  })
})
