import { describe, it, expect } from 'vitest'
import { cycleToMinimum } from '../practiceUtils'
import type { StudyItem } from '@/app/study/StudySession'
import type { Concept, Exercise } from '@/lib/supabase/types'

function makeItem(exerciseId: string): StudyItem {
  const concept: Concept = {
    id: 'concept-1',
    unit_id: 'unit-1',
    type: 'grammar',
    title: 'Test Concept',
    explanation: 'Explanation',
    examples: [],
    difficulty: 1,
    level: 'B1',
    grammar_focus: 'indicative',
    created_at: '2024-01-01T00:00:00Z',
  }
  const exercise: Exercise = {
    id: exerciseId,
    concept_id: 'concept-1',
    type: 'gap_fill',
    prompt: 'Test',
    expected_answer: 'answer',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    source: 'seed',
    created_at: '2024-01-01T00:00:00Z',
  }
  return { concept, exercise }
}

describe('cycleToMinimum', () => {
  it('returns items unchanged when length >= min', () => {
    const items = [makeItem('e1'), makeItem('e2'), makeItem('e3'), makeItem('e4'), makeItem('e5')]
    const result = cycleToMinimum(items, 5)
    expect(result).toHaveLength(5)
    expect(result).toBe(items) // same reference
  })

  it('returns items unchanged when length > min', () => {
    const items = [makeItem('e1'), makeItem('e2'), makeItem('e3'), makeItem('e4'), makeItem('e5'), makeItem('e6')]
    const result = cycleToMinimum(items, 5)
    expect(result).toHaveLength(6)
  })

  it('cycles items up to MIN_PRACTICE_SIZE minimum', () => {
    const items = [makeItem('e1'), makeItem('e2')]
    const result = cycleToMinimum(items, 5)
    expect(result.length).toBeGreaterThanOrEqual(5)
  })

  it('avoids consecutive duplicates when pool >= 2', () => {
    const items = [makeItem('e1'), makeItem('e2')]
    const result = cycleToMinimum(items, 5)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].exercise.id).not.toBe(result[i - 1].exercise.id)
    }
  })

  it('returns empty array when items is empty', () => {
    expect(cycleToMinimum([], 5)).toEqual([])
  })

  it('allows consecutive duplicates when pool is 1 (unavoidable)', () => {
    const items = [makeItem('e1')]
    const result = cycleToMinimum(items, 5)
    expect(result).toHaveLength(5)
    // All items must be the same exercise
    for (const item of result) {
      expect(item.exercise.id).toBe('e1')
    }
  })
})
