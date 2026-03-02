/**
 * Seed the database with curriculum content.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx src/lib/curriculum/run-seed.ts
 *
 * Requires: @supabase/supabase-js, tsx (pnpm add -D tsx)
 * Uses the service role key to bypass RLS.
 */

import { createClient } from '@supabase/supabase-js'
import { SEED_MODULES, SEED_UNITS, SEED_CONCEPTS, SEED_EXERCISES } from './seed'
import type { Database, Module, Unit, Concept, Exercise } from '../supabase/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY)

async function seed() {
  console.log('🌱 Seeding curriculum...\n')

  // 1. Insert modules
  const { data: modules, error: modErr } = await supabase
    .from('modules')
    .insert(SEED_MODULES.map(m => ({ title: m.title, description: m.description, order_index: m.order_index })))
    .select()

  if (modErr) throw new Error(`Modules: ${modErr.message}`)
  const typedModules = modules as Module[]
  console.log(`✅ Inserted ${typedModules.length} modules`)

  // 2. Insert units (resolve module_index → module id)
  const unitsToInsert = SEED_UNITS.map(u => ({
    module_id: typedModules[u.module_index].id,
    title: u.title,
    order_index: u.order_index,
  }))

  const { data: units, error: unitErr } = await supabase
    .from('units')
    .insert(unitsToInsert)
    .select()

  if (unitErr) throw new Error(`Units: ${unitErr.message}`)
  const typedUnits = units as Unit[]
  console.log(`✅ Inserted ${typedUnits.length} units`)

  // 3. Insert concepts (resolve unit_index → unit id)
  const conceptsToInsert = SEED_CONCEPTS.map(c => ({
    unit_id: typedUnits[c.unit_index].id,
    type: c.type,
    title: c.title,
    explanation: c.explanation,
    examples: c.examples,
    difficulty: c.difficulty,
  }))

  const { data: concepts, error: conceptErr } = await supabase
    .from('concepts')
    .insert(conceptsToInsert)
    .select()

  if (conceptErr) throw new Error(`Concepts: ${conceptErr.message}`)
  const typedConcepts = concepts as Concept[]
  console.log(`✅ Inserted ${typedConcepts.length} concepts`)

  // 4. Insert exercises (resolve concept_index → concept id)
  const exercisesToInsert = SEED_EXERCISES.map(e => ({
    concept_id: typedConcepts[e.concept_index].id,
    type: e.type,
    prompt: e.prompt,
    expected_answer: e.expected_answer,
    answer_variants: e.answer_variants ? { variants: e.answer_variants } : null,
    hint_1: e.hint_1,
    hint_2: e.hint_2,
  }))

  const { data: exercises, error: exErr } = await supabase
    .from('exercises')
    .insert(exercisesToInsert)
    .select()

  if (exErr) throw new Error(`Exercises: ${exErr.message}`)
  const typedExercises = exercises as Exercise[]
  console.log(`✅ Inserted ${typedExercises.length} exercises`)

  console.log('\n🎉 Seed complete!')
  console.log(`   Modules: ${typedModules.length}`)
  console.log(`   Units:   ${typedUnits.length}`)
  console.log(`   Concepts: ${typedConcepts.length}`)
  console.log(`   Exercises: ${typedExercises.length}`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
