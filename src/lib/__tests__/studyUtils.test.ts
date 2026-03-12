import { describe, it, expect } from 'vitest'
import { biasedExercisePick, dropGapFillForPractice } from '../studyUtils'
import type { Exercise, Concept } from '@/lib/supabase/types'

const baseConcept: Concept = {
  id: 'concept-1',
  unit_id: 'unit-1',
  type: 'grammar',
  title: 'Test concept',
  explanation: 'Explanation',
  examples: [],
  difficulty: 1,
  level: 'B1',
  grammar_focus: null,
  created_at: '2026-01-01T00:00:00Z',
}

function makeExercise(type: string, id = 'ex-1'): Exercise {
  return {
    id,
    concept_id: 'concept-1',
    type,
    prompt: 'test prompt',
    expected_answer: 'answer',
    answer_variants: null,
    hint_1: null,
    hint_2: null,
    annotations: null,
    created_at: '2026-01-01T00:00:00Z',
  }
}

function makeStudyItem(type: string, id = 'ex-1') {
  return {
    concept: baseConcept,
    exercise: makeExercise(type, id),
  }
}

describe('biasedExercisePick', () => {
  it('returns the only exercise when array has one item', () => {
    const ex = makeExercise('gap_fill')
    expect(biasedExercisePick([ex], true)).toBe(ex)
  })

  it('throws on empty array', () => {
    expect(() => biasedExercisePick([], false)).toThrow()
  })

  it('with underweight=true, gap_fill is picked less than 30% of the time (N=1000)', () => {
    const exercises = [
      makeExercise('gap_fill', 'gf'),
      makeExercise('translation', 'tr'),
      makeExercise('transformation', 'tf'),
    ]
    let gapFillCount = 0
    for (let i = 0; i < 1000; i++) {
      const picked = biasedExercisePick(exercises, true)
      if (picked.type === 'gap_fill') gapFillCount++
    }
    // With 80% exclusion chance and 1/3 base rate, expected ~6.7% gap_fill
    expect(gapFillCount).toBeLessThan(300)
  })

  it('with underweight=false, distribution is roughly uniform', () => {
    const exercises = [
      makeExercise('gap_fill', 'gf'),
      makeExercise('translation', 'tr'),
      makeExercise('transformation', 'tf'),
    ]
    let gapFillCount = 0
    for (let i = 0; i < 1000; i++) {
      const picked = biasedExercisePick(exercises, false)
      if (picked.type === 'gap_fill') gapFillCount++
    }
    // Expect roughly 333 ± tolerance; at least >200
    expect(gapFillCount).toBeGreaterThan(200)
  })

  it('when all exercises are gap_fill, always returns one (no crash)', () => {
    const exercises = [
      makeExercise('gap_fill', 'gf1'),
      makeExercise('gap_fill', 'gf2'),
    ]
    for (let i = 0; i < 100; i++) {
      const picked = biasedExercisePick(exercises, true)
      expect(picked.type).toBe('gap_fill')
    }
  })
})

describe('dropGapFillForPractice', () => {
  it('reduces gap_fill count by approximately 60% (N=1000 runs)', () => {
    const items = [
      makeStudyItem('gap_fill', 'gf1'),
      makeStudyItem('gap_fill', 'gf2'),
      makeStudyItem('gap_fill', 'gf3'),
      makeStudyItem('gap_fill', 'gf4'),
      makeStudyItem('gap_fill', 'gf5'),
      makeStudyItem('translation', 'tr1'),
      makeStudyItem('transformation', 'tf1'),
    ]
    let totalGapFill = 0
    const runs = 1000
    for (let i = 0; i < runs; i++) {
      const result = dropGapFillForPractice(items)
      totalGapFill += result.filter(r => r.exercise.type === 'gap_fill').length
    }
    const avgGapFill = totalGapFill / runs
    // Original 5 gap_fill; ~40% kept = ~2.0 expected; should be between 1 and 3.5
    expect(avgGapFill).toBeGreaterThan(1)
    expect(avgGapFill).toBeLessThan(3.5)
  })

  it('never drops all items', () => {
    const items = [
      makeStudyItem('gap_fill', 'gf1'),
      makeStudyItem('translation', 'tr1'),
    ]
    for (let i = 0; i < 200; i++) {
      const result = dropGapFillForPractice(items)
      expect(result.length).toBeGreaterThan(0)
    }
  })

  it('does not drop non-gap_fill items', () => {
    const items = [
      makeStudyItem('gap_fill', 'gf1'),
      makeStudyItem('gap_fill', 'gf2'),
      makeStudyItem('translation', 'tr1'),
      makeStudyItem('transformation', 'tf1'),
      makeStudyItem('error_correction', 'ec1'),
    ]
    for (let i = 0; i < 100; i++) {
      const result = dropGapFillForPractice(items)
      const nonGap = result.filter(r => r.exercise.type !== 'gap_fill')
      expect(nonGap.length).toBe(3)
    }
  })

  it('returns original list when no gap_fill items exist', () => {
    const items = [
      makeStudyItem('translation', 'tr1'),
      makeStudyItem('transformation', 'tf1'),
    ]
    expect(dropGapFillForPractice(items)).toBe(items)
  })

  it('returns original list when all items are gap_fill', () => {
    const items = [
      makeStudyItem('gap_fill', 'gf1'),
      makeStudyItem('gap_fill', 'gf2'),
    ]
    expect(dropGapFillForPractice(items)).toBe(items)
  })
})
