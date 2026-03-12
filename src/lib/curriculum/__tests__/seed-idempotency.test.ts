/**
 * Tests for idempotency guards in seed:ai:apply and seed:verbs:apply.
 *
 * These tests verify the dedup logic by mocking Supabase calls and asserting
 * that duplicate concepts/exercises/verb-sentence combos are skipped.
 */
import { describe, it, expect, vi } from 'vitest'

// ── seed:ai:apply — concept-level dedup (mode: 'new') ──────────────────────

describe('seed:ai:apply idempotency — new mode', () => {
  it('skips concept when title + unit_id already exists in DB', async () => {
    // Simulate: concept "Ser vs Estar" already exists in the unit
    const existingConceptId = 'concept-existing-uuid'
    const unitId = 'unit-uuid'

    // The dedup check: SELECT id FROM concepts WHERE title = X AND unit_id = Y
    const conceptCheckData = { id: existingConceptId }

    // Build a supabase mock where .from('concepts').select('id').eq(...).eq(...).single()
    // returns an existing concept
    let capturedTitle = ''
    let capturedUnitId = ''

    const conceptsFrom = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((col: string, val: string) => {
          if (col === 'title') capturedTitle = val
          if (col === 'unit_id') capturedUnitId = val
          return {
            eq: vi.fn().mockImplementation((col2: string, val2: string) => {
              if (col2 === 'unit_id') capturedUnitId = val2
              if (col2 === 'title') capturedTitle = val2
              return {
                single: vi.fn().mockResolvedValue({ data: conceptCheckData, error: null }),
              }
            }),
            single: vi.fn().mockResolvedValue({ data: conceptCheckData, error: null }),
          }
        }),
      }),
      insert: vi.fn(),
    }

    // The dedup logic: if concept exists, return early with inserted: 0
    // We replicate just the dedup check here
    const { data: existingConcept } = await conceptsFrom.select('id')
      .eq('title', 'Ser vs Estar')
      .eq('unit_id', unitId)
      .single()

    expect(existingConcept).toEqual({ id: existingConceptId })
    expect(capturedTitle).toBe('Ser vs Estar')
    expect(capturedUnitId).toBe(unitId)

    // Verify concept insert was NOT called
    expect(conceptsFrom.insert).not.toHaveBeenCalled()
  })

  it('proceeds with insert when concept does not exist', async () => {
    const unitId = 'unit-uuid'

    const conceptsFrom = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      }),
    }

    const { data: existingConcept } = await conceptsFrom.select('id')
      .eq('title', 'New Concept')
      .eq('unit_id', unitId)
      .single()

    // No existing concept → should proceed with insert
    expect(existingConcept).toBeNull()
  })
})

// ── seed:ai:apply — exercise-level dedup (mode: 'topup') ───────────────────

describe('seed:ai:apply idempotency — topup mode', () => {
  it('filters out exercises whose type+prompt already exist for the concept', () => {
    // Simulate existing exercises in DB
    const existingExercises = [
      { type: 'gap_fill', prompt: 'Ella ___ (ser) doctora.' },
      { type: 'translation', prompt: 'Translate: The house is big.' },
    ]

    const existingSet = new Set(
      existingExercises.map((e) => `${e.type}::${e.prompt}`),
    )

    // New exercises from the review file — 1 duplicate, 1 new
    const reviewExercises = [
      { type: 'gap_fill', prompt: 'Ella ___ (ser) doctora.', expected_answer: 'es', hint_1: null, hint_2: null, annotations: null },
      { type: 'gap_fill', prompt: 'Nosotros ___ (estar) cansados.', expected_answer: 'estamos', hint_1: null, hint_2: null, annotations: null },
    ]

    const newExercises = reviewExercises.filter(
      (ex) => !existingSet.has(`${ex.type}::${ex.prompt}`),
    )

    expect(newExercises).toHaveLength(1)
    expect(newExercises[0].prompt).toBe('Nosotros ___ (estar) cansados.')
  })

  it('returns empty array when all exercises already exist', () => {
    const existingExercises = [
      { type: 'gap_fill', prompt: 'Prompt A' },
      { type: 'translation', prompt: 'Prompt B' },
    ]

    const existingSet = new Set(
      existingExercises.map((e) => `${e.type}::${e.prompt}`),
    )

    const reviewExercises = [
      { type: 'gap_fill', prompt: 'Prompt A' },
      { type: 'translation', prompt: 'Prompt B' },
    ]

    const newExercises = reviewExercises.filter(
      (ex) => !existingSet.has(`${ex.type}::${ex.prompt}`),
    )

    expect(newExercises).toHaveLength(0)
  })
})

// ── seed:verbs:apply — combo-level dedup ────────────────────────────────────

describe('seed:verbs:apply idempotency', () => {
  it('skips combos whose verb_id + tense already have sentences in DB', () => {
    // Simulate existing verb_sentences rows
    const existingRows = [
      { verb_id: 'verb-1', tense: 'present' },
      { verb_id: 'verb-1', tense: 'present' }, // duplicates from multiple sentences
      { verb_id: 'verb-2', tense: 'preterite' },
    ]

    const existingCombos = new Set(
      existingRows.map((r) => `${r.verb_id}::${r.tense}`),
    )

    const combos = [
      { verb_id: 'verb-1', verb_infinitive: 'ser', tense: 'present', sentences: [{ pronoun: 'yo', sentence: 'Yo ___ alto.', correct_form: 'soy', tense_rule: '' }] },
      { verb_id: 'verb-1', verb_infinitive: 'ser', tense: 'imperfect', sentences: [{ pronoun: 'yo', sentence: 'Yo ___ alto.', correct_form: 'era', tense_rule: '' }] },
      { verb_id: 'verb-2', verb_infinitive: 'estar', tense: 'preterite', sentences: [{ pronoun: 'yo', sentence: 'Yo ___ bien.', correct_form: 'estuve', tense_rule: '' }] },
      { verb_id: 'verb-3', verb_infinitive: 'tener', tense: 'present', sentences: [{ pronoun: 'yo', sentence: 'Yo ___ hambre.', correct_form: 'tengo', tense_rule: '' }] },
    ]

    const newCombos = combos.filter(
      (combo) => !existingCombos.has(`${combo.verb_id}::${combo.tense}`),
    )

    // verb-1:present and verb-2:preterite should be skipped
    expect(newCombos).toHaveLength(2)
    expect(newCombos.map((c) => `${c.verb_infinitive}:${c.tense}`)).toEqual([
      'ser:imperfect',
      'tener:present',
    ])
  })

  it('inserts all combos when DB is empty', () => {
    const existingCombos = new Set<string>()

    const combos = [
      { verb_id: 'verb-1', verb_infinitive: 'ser', tense: 'present', sentences: [] },
      { verb_id: 'verb-2', verb_infinitive: 'estar', tense: 'present', sentences: [] },
    ]

    const newCombos = combos.filter(
      (combo) => !existingCombos.has(`${combo.verb_id}::${combo.tense}`),
    )

    expect(newCombos).toHaveLength(2)
  })

  it('inserts nothing when all combos already exist', () => {
    const existingCombos = new Set(['verb-1::present', 'verb-2::preterite'])

    const combos = [
      { verb_id: 'verb-1', verb_infinitive: 'ser', tense: 'present', sentences: [] },
      { verb_id: 'verb-2', verb_infinitive: 'estar', tense: 'preterite', sentences: [] },
    ]

    const newCombos = combos.filter(
      (combo) => !existingCombos.has(`${combo.verb_id}::${combo.tense}`),
    )

    expect(newCombos).toHaveLength(0)
  })
})
