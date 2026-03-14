import { describe, it, expect } from 'vitest'
import {
  EXERCISE_TYPE_RULES,
  EXERCISE_GENERATION_RULES,
  EXERCISES_PER_TYPE,
  exercisesPerConcept,
} from '../ai-seed-config'
import type { CefrLevel, ExerciseType } from '../ai-seed-config'

const VALID_LEVELS: CefrLevel[] = ['B1', 'B2', 'C1']
const VALID_EXERCISE_TYPES: ExerciseType[] = [
  'gap_fill',
  'transformation',
  'translation',
  'error_correction',
  'free_write',
  'listening',
  'proofreading',
  'register_shift',
]

describe('EXERCISE_TYPE_RULES', () => {
  it('covers all three CEFR levels', () => {
    for (const level of VALID_LEVELS) {
      expect(EXERCISE_TYPE_RULES).toHaveProperty(level)
    }
  })

  it('has no extra levels beyond B1, B2, C1', () => {
    const keys = Object.keys(EXERCISE_TYPE_RULES)
    expect(keys).toHaveLength(3)
    expect(keys.sort()).toEqual(['B1', 'B2', 'C1'])
  })

  it('B1 has 3 types', () => {
    expect(EXERCISE_TYPE_RULES.B1).toHaveLength(3)
  })

  it('B2 has 5 types', () => {
    expect(EXERCISE_TYPE_RULES.B2).toHaveLength(5)
  })

  it('C1 has 6 types', () => {
    expect(EXERCISE_TYPE_RULES.C1).toHaveLength(6)
  })

  it('each level contains only valid ExerciseType values', () => {
    for (const level of VALID_LEVELS) {
      for (const type of EXERCISE_TYPE_RULES[level]) {
        expect(VALID_EXERCISE_TYPES).toContain(type)
      }
    }
  })

  it('B1 uses gap_fill, transformation, translation', () => {
    expect(EXERCISE_TYPE_RULES.B1).toEqual(['gap_fill', 'transformation', 'translation'])
  })

  it('B2 uses gap_fill, translation, error_correction, listening, proofreading', () => {
    expect(EXERCISE_TYPE_RULES.B2).toEqual(['gap_fill', 'translation', 'error_correction', 'listening', 'proofreading'])
  })

  it('C1 uses transformation, translation, free_write, listening, proofreading, register_shift', () => {
    expect(EXERCISE_TYPE_RULES.C1).toEqual(['transformation', 'translation', 'free_write', 'listening', 'proofreading', 'register_shift'])
  })
})

describe('EXERCISE_GENERATION_RULES', () => {
  it('covers all valid ExerciseType values', () => {
    for (const type of VALID_EXERCISE_TYPES) {
      expect(EXERCISE_GENERATION_RULES).toHaveProperty(type)
    }
  })

  it('each rule is a non-empty string', () => {
    for (const type of VALID_EXERCISE_TYPES) {
      const rule = EXERCISE_GENERATION_RULES[type]
      expect(typeof rule).toBe('string')
      expect(rule.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('constants', () => {
  it('EXERCISES_PER_TYPE is 3', () => {
    expect(EXERCISES_PER_TYPE).toBe(3)
  })

  it('exercisesPerConcept returns correct count per level', () => {
    expect(exercisesPerConcept('B1')).toBe(9)   // 3 types × 3
    expect(exercisesPerConcept('B2')).toBe(15)  // 5 types × 3
    expect(exercisesPerConcept('C1')).toBe(18)  // 6 types × 3
  })
})
