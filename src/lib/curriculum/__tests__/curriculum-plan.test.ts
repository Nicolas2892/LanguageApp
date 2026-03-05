import { describe, it, expect } from 'vitest'
import { CURRICULUM_PLAN } from '../curriculum-plan'
import type { ConceptPlan, ExerciseType, CefrLevel, GrammarFocus } from '../curriculum-plan'

const VALID_LEVELS: CefrLevel[] = ['B1', 'B2', 'C1']
const VALID_GRAMMAR_FOCUS: GrammarFocus[] = ['indicative', 'subjunctive', 'both']
const VALID_EXERCISE_TYPES: ExerciseType[] = [
  'gap_fill',
  'transformation',
  'translation',
  'error_correction',
  'free_write',
]

describe('CURRICULUM_PLAN', () => {
  it('contains exactly 85 concepts', () => {
    expect(CURRICULUM_PLAN).toHaveLength(85)
  })

  describe('each concept has required fields', () => {
    CURRICULUM_PLAN.forEach((concept, i) => {
      describe(`concept[${i}]: "${concept.title}"`, () => {
        it('has a non-empty title', () => {
          expect(typeof concept.title).toBe('string')
          expect(concept.title.trim().length).toBeGreaterThan(0)
        })

        it('has a non-empty module', () => {
          expect(typeof concept.module).toBe('string')
          expect(concept.module.trim().length).toBeGreaterThan(0)
        })

        it('has a non-empty unit', () => {
          expect(typeof concept.unit).toBe('string')
          expect(concept.unit.trim().length).toBeGreaterThan(0)
        })

        it('has a non-empty description', () => {
          expect(typeof concept.description).toBe('string')
          expect(concept.description.trim().length).toBeGreaterThan(0)
        })

        it('has a valid level', () => {
          expect(VALID_LEVELS).toContain(concept.level)
        })

        it('has a valid grammar_focus', () => {
          expect(VALID_GRAMMAR_FOCUS).toContain(concept.grammar_focus)
        })

        it('has difficulty between 1 and 5', () => {
          expect(concept.difficulty).toBeGreaterThanOrEqual(1)
          expect(concept.difficulty).toBeLessThanOrEqual(5)
        })

        it('has a non-empty type', () => {
          expect(typeof concept.type).toBe('string')
          expect(concept.type.trim().length).toBeGreaterThan(0)
        })

        it('has exerciseTypes as a 3-tuple of valid ExerciseType values', () => {
          expect(Array.isArray(concept.exerciseTypes)).toBe(true)
          expect(concept.exerciseTypes).toHaveLength(3)
          for (const t of concept.exerciseTypes) {
            expect(VALID_EXERCISE_TYPES).toContain(t)
          }
        })
      })
    })
  })

  describe('structural integrity', () => {
    it('has no duplicate concept titles within the same unit', () => {
      const seen = new Map<string, Set<string>>()
      const duplicates: string[] = []

      for (const concept of CURRICULUM_PLAN) {
        const unitKey = `${concept.module}::${concept.unit}`
        if (!seen.has(unitKey)) seen.set(unitKey, new Set())
        const unitTitles = seen.get(unitKey)!

        if (unitTitles.has(concept.title)) {
          duplicates.push(`${unitKey} → "${concept.title}"`)
        }
        unitTitles.add(concept.title)
      }

      expect(duplicates).toEqual([])
    })

    it('has no duplicate concept titles across the entire plan', () => {
      const titles = CURRICULUM_PLAN.map((c) => c.title)
      const unique = new Set(titles)
      expect(unique.size).toBe(titles.length)
    })

    it('groups into exactly 7 distinct modules', () => {
      const modules = new Set(CURRICULUM_PLAN.map((c) => c.module))
      expect(modules.size).toBe(7)
    })

    it('contains the expected 7 module names', () => {
      const modules = new Set(CURRICULUM_PLAN.map((c) => c.module))
      expect(modules).toContain('Connectors & Discourse Markers')
      expect(modules).toContain('The Subjunctive: Core')
      expect(modules).toContain('The Subjunctive: Advanced')
      expect(modules).toContain('Past Tenses')
      expect(modules).toContain('Core Spanish Contrasts')
      expect(modules).toContain('Verbal Periphrases')
      expect(modules).toContain('Complex Sentences')
    })

    it('has Module 1 with 23 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'Connectors & Discourse Markers').length
      expect(count).toBe(23)
    })

    it('has The Subjunctive: Core with 5 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'The Subjunctive: Core').length
      expect(count).toBe(5)
    })

    it('has The Subjunctive: Advanced with 8 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'The Subjunctive: Advanced').length
      expect(count).toBe(8)
    })

    it('has Module 3 with 11 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'Past Tenses').length
      expect(count).toBe(11)
    })

    it('has Module 4 with 12 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'Core Spanish Contrasts').length
      expect(count).toBe(12)
    })

    it('has Module 5 with 13 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'Verbal Periphrases').length
      expect(count).toBe(13)
    })

    it('has Module 6 with 13 concepts', () => {
      const count = CURRICULUM_PLAN.filter((c) => c.module === 'Complex Sentences').length
      expect(count).toBe(13)
    })

    it('has Module 1 Unit 1.2 with 7 concepts (including por eso and así que)', () => {
      const unit = CURRICULUM_PLAN.filter(
        (c) =>
          c.module === 'Connectors & Discourse Markers' &&
          c.unit === 'Causal & Consecutive Connectors'
      )
      expect(unit).toHaveLength(7)
      const titles = unit.map((c) => c.title)
      expect(titles).toContain('por eso / por esa razón')
      expect(titles).toContain('así que')
    })

    it('has Module 1 Unit 1.4 renamed to "Linking, Structuring & Reformulation" with 6 concepts', () => {
      const unit = CURRICULUM_PLAN.filter(
        (c) =>
          c.module === 'Connectors & Discourse Markers' &&
          c.unit === 'Linking, Structuring & Reformulation'
      )
      expect(unit).toHaveLength(6)
    })

    it('Unit 1.4 contains además, es decir, en cuanto a, en definitiva', () => {
      const unit = CURRICULUM_PLAN.filter(
        (c) => c.unit === 'Linking, Structuring & Reformulation'
      )
      const titles = unit.map((c) => c.title)
      expect(titles).toContain('además')
      expect(titles).toContain('es decir / o sea')
      expect(titles).toContain('en cuanto a / con respecto a')
      expect(titles).toContain('en definitiva / en conclusión / en suma')
    })

    it('all difficulty values are integers', () => {
      for (const concept of CURRICULUM_PLAN) {
        expect(Number.isInteger(concept.difficulty)).toBe(true)
      }
    })

    it('includes concepts at all three CEFR levels', () => {
      const levels = new Set(CURRICULUM_PLAN.map((c) => c.level))
      expect(levels).toContain('B1')
      expect(levels).toContain('B2')
      expect(levels).toContain('C1')
    })
  })
})
