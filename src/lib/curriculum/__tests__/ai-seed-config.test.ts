import { describe, it, expect } from 'vitest'
import {
  EXERCISE_TYPE_RULES,
  EXERCISE_GENERATION_RULES,
  EXERCISES_PER_TYPE,
  EXERCISES_PER_CONCEPT,
} from '../ai-seed-config'
import type { CefrLevel, ExerciseType } from '../ai-seed-config'

const VALID_LEVELS: CefrLevel[] = ['B1', 'B2', 'C1']
const VALID_EXERCISE_TYPES: ExerciseType[] = [
  'gap_fill',
  'transformation',
  'translation',
  'error_correction',
  'free_write',
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

  it('each level maps to a 3-tuple', () => {
    for (const level of VALID_LEVELS) {
      const tuple = EXERCISE_TYPE_RULES[level]
      expect(Array.isArray(tuple)).toBe(true)
      expect(tuple).toHaveLength(3)
    }
  })

  it('each tuple contains only valid ExerciseType values', () => {
    for (const level of VALID_LEVELS) {
      for (const type of EXERCISE_TYPE_RULES[level]) {
        expect(VALID_EXERCISE_TYPES).toContain(type)
      }
    }
  })

  it('B1 uses gap_fill, transformation, translation', () => {
    expect(EXERCISE_TYPE_RULES.B1).toEqual(['gap_fill', 'transformation', 'translation'])
  })

  it('B2 uses gap_fill, translation, error_correction', () => {
    expect(EXERCISE_TYPE_RULES.B2).toEqual(['gap_fill', 'translation', 'error_correction'])
  })

  it('C1 uses transformation, translation, free_write', () => {
    expect(EXERCISE_TYPE_RULES.C1).toEqual(['transformation', 'translation', 'free_write'])
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

  it('EXERCISES_PER_CONCEPT is 9 (3 types × 3)', () => {
    expect(EXERCISES_PER_CONCEPT).toBe(9)
    expect(EXERCISES_PER_CONCEPT).toBe(EXERCISES_PER_TYPE * 3)
  })
})
