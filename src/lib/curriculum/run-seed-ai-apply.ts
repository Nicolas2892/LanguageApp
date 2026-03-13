/**
 * Apply approved entries from a curriculum-review JSON file to Supabase.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   pnpm seed:ai:apply [--dry-run] <path-to-review-file.json>
 *
 * Flags:
 *   --dry-run   Print what would be inserted without writing to DB
 *
 * Only entries where _approved === true are processed.
 * _mode: 'new'    → upsert module → upsert unit → insert concept → insert exercises
 * _mode: 'topup'  → look up concept by title → insert exercises only
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../supabase/types'

// ─── Env validation ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnnotationSpan {
  text: string
  form: 'subjunctive' | 'indicative' | null
}

interface ReviewExercise {
  type: string
  prompt: string
  expected_answer: string
  hint_1: string | null
  hint_2: string | null
  annotations: AnnotationSpan[] | null
}

interface ReviewConcept {
  title: string
  module: string
  unit: string
  level: string
  grammar_focus: string
  difficulty: number
  type: string
  explanation: string | null
  examples: Array<{ es: string; en: string }> | null
  exercises: ReviewExercise[]
  _mode: 'new' | 'topup'
  _approved: boolean
  _notes: string
  _annotationsValid: boolean
}

interface DbRow {
  id: string
  title: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArgs(): { dryRun: boolean; filePath: string } {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const filePath = args.find((a) => !a.startsWith('--'))

  if (!filePath) {
    console.error('❌ Usage: pnpm seed:ai:apply [--dry-run] <path-to-review-file.json>')
    process.exit(1)
  }

  return { dryRun, filePath }
}

function loadReviewFile(filePath: string): ReviewConcept[] {
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)
  if (!fs.existsSync(resolved)) {
    console.error(`❌ File not found: ${resolved}`)
    process.exit(1)
  }
  const raw = fs.readFileSync(resolved, 'utf8')
  return JSON.parse(raw) as ReviewConcept[]
}

// ─── Core apply logic ─────────────────────────────────────────────────────────

async function applyEntry(
  supabase: SupabaseClient<Database>,
  entry: ReviewConcept,
  moduleCache: Map<string, string>,
  unitCache: Map<string, string>,
  conceptCache: Map<string, string>,
  dryRun: boolean,
): Promise<{ inserted: number; failed: boolean }> {

  if (entry._mode === 'topup') {
    // Look up concept by title
    let conceptId = conceptCache.get(entry.title)

    if (!conceptId) {
      const { data, error } = await supabase
        .from('concepts')
        .select('id')
        .eq('title', entry.title)
        .single()

      if (error || !data) {
        console.error(`    ❌ Concept not found in DB: "${entry.title}"`)
        return { inserted: 0, failed: true }
      }
      conceptId = (data as DbRow).id
      conceptCache.set(entry.title, conceptId)
    }

    // Dedup: fetch existing exercises for this concept to skip duplicates
    const { data: existingExercises } = await supabase
      .from('exercises')
      .select('type, prompt')
      .eq('concept_id', conceptId)

    const existingSet = new Set(
      ((existingExercises as Array<{ type: string; prompt: string }>) ?? []).map(
        (e) => `${e.type}::${e.prompt}`,
      ),
    )

    const newExercises = entry.exercises.filter(
      (ex) => !existingSet.has(`${ex.type}::${ex.prompt}`),
    )
    const skippedCount = entry.exercises.length - newExercises.length

    if (skippedCount > 0) {
      console.log(`    ⚠️  Skipped ${skippedCount} duplicate exercise(s)`)
    }

    if (newExercises.length === 0) {
      console.log(`    ⚠️  All exercises already exist — nothing to insert`)
      return { inserted: 0, failed: false }
    }

    if (dryRun) {
      console.log(`    [DRY RUN] Would insert ${newExercises.length} exercise(s) for concept "${entry.title}" (topup)`)
      return { inserted: newExercises.length, failed: false }
    }

    const exercisesToInsert = newExercises.map((ex) => ({
      concept_id: conceptId!,
      type: ex.type,
      prompt: ex.prompt,
      expected_answer: ex.expected_answer,
      hint_1: ex.hint_1 ?? null,
      hint_2: ex.hint_2 ?? null,
      annotations: ex.annotations ?? null,
      source: 'seed' as const,
    }))

    const { error: insertErr } = await supabase.from('exercises').insert(exercisesToInsert)
    if (insertErr) {
      console.error(`    ❌ Exercise insert failed for "${entry.title}": ${insertErr.message}`)
      return { inserted: 0, failed: true }
    }

    return { inserted: newExercises.length, failed: false }
  }

  // _mode === 'new'
  // 1. Upsert module
  let moduleId = moduleCache.get(entry.module)
  if (!moduleId) {
    if (dryRun) {
      moduleId = `[DRY-module:${entry.module}]`
    } else {
      // Try to find existing module first
      const { data: existingMod } = await supabase
        .from('modules')
        .select('id')
        .eq('title', entry.module)
        .single()

      if (existingMod) {
        moduleId = (existingMod as DbRow).id
      } else {
        // Insert new module — order_index based on how many modules exist
        const { data: allMods } = await supabase.from('modules').select('id')
        const orderIndex = ((allMods as DbRow[])?.length ?? 0) + 1

        const { data: newMod, error: modErr } = await supabase
          .from('modules')
          .insert({ title: entry.module, description: null, order_index: orderIndex })
          .select('id')
          .single()

        if (modErr || !newMod) {
          console.error(`    ❌ Module insert failed for "${entry.module}": ${modErr?.message}`)
          return { inserted: 0, failed: true }
        }
        moduleId = (newMod as DbRow).id
      }
    }
    moduleCache.set(entry.module, moduleId!)
  }

  // 2. Upsert unit
  const unitKey = `${entry.module}::${entry.unit}`
  let unitId = unitCache.get(unitKey)
  if (!unitId) {
    if (dryRun) {
      unitId = `[DRY-unit:${entry.unit}]`
    } else {
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id')
        .eq('title', entry.unit)
        .eq('module_id', moduleId!)
        .single()

      if (existingUnit) {
        unitId = (existingUnit as DbRow).id
      } else {
        // Count existing units in this module for order_index
        const { data: modUnits } = await supabase
          .from('units')
          .select('id')
          .eq('module_id', moduleId!)

        const orderIndex = ((modUnits as DbRow[])?.length ?? 0) + 1

        const { data: newUnit, error: unitErr } = await supabase
          .from('units')
          .insert({ module_id: moduleId!, title: entry.unit, order_index: orderIndex })
          .select('id')
          .single()

        if (unitErr || !newUnit) {
          console.error(`    ❌ Unit insert failed for "${entry.unit}": ${unitErr?.message}`)
          return { inserted: 0, failed: true }
        }
        unitId = (newUnit as DbRow).id
      }
    }
    unitCache.set(unitKey, unitId!)
  }

  // 3. Dedup: check if concept already exists in this unit
  if (!dryRun) {
    const { data: existingConcept } = await supabase
      .from('concepts')
      .select('id')
      .eq('title', entry.title)
      .eq('unit_id', unitId!)
      .single()

    if (existingConcept) {
      console.log(`    ⚠️  Skipped (concept already exists in unit)`)
      return { inserted: 0, failed: false }
    }
  }

  if (dryRun) {
    console.log(`    [DRY RUN] Would insert concept "${entry.title}" (${entry.level}) with ${entry.exercises.length} exercises into "${entry.module} > ${entry.unit}"`)
    return { inserted: entry.exercises.length, failed: false }
  }

  const { data: newConcept, error: conceptErr } = await supabase
    .from('concepts')
    .insert({
      unit_id: unitId!,
      type: entry.type,
      title: entry.title,
      explanation: entry.explanation ?? '',
      examples: entry.examples ?? [],
      difficulty: entry.difficulty,
      level: entry.level,
      grammar_focus: entry.grammar_focus,
    })
    .select('id')
    .single()

  if (conceptErr || !newConcept) {
    console.error(`    ❌ Concept insert failed for "${entry.title}": ${conceptErr?.message}`)
    return { inserted: 0, failed: true }
  }

  const conceptId = (newConcept as DbRow).id
  conceptCache.set(entry.title, conceptId)

  // 4. Insert exercises
  const exercisesToInsert = entry.exercises.map((ex) => ({
    concept_id: conceptId,
    type: ex.type,
    prompt: ex.prompt,
    expected_answer: ex.expected_answer,
    hint_1: ex.hint_1 ?? null,
    hint_2: ex.hint_2 ?? null,
    annotations: ex.annotations ?? null,
    source: 'seed' as const,
  }))

  const { error: exErr } = await supabase.from('exercises').insert(exercisesToInsert)
  if (exErr) {
    console.error(`    ❌ Exercise insert failed for "${entry.title}": ${exErr.message}`)
    return { inserted: 0, failed: true }
  }

  return { inserted: entry.exercises.length, failed: false }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { dryRun, filePath } = parseArgs()
  const entries = loadReviewFile(filePath)

  const approved = entries.filter((e) => e._approved)
  const skipped = entries.length - approved.length

  console.log(`\n📋 Review file: ${filePath}`)
  console.log(`   Total entries:    ${entries.length}`)
  console.log(`   Approved:         ${approved.length}`)
  console.log(`   Skipped (unapproved): ${skipped}`)
  if (dryRun) console.log('\n   ⚠️  DRY RUN — no DB writes will occur\n')
  else console.log()

  const supabase = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!)

  const moduleCache = new Map<string, string>()
  const unitCache = new Map<string, string>()
  const conceptCache = new Map<string, string>()

  let totalInserted = 0
  let succeeded = 0
  let failed = 0

  for (const entry of approved) {
    const modeLabel = entry._mode === 'new' ? '🆕 NEW' : '⬆️  TOP'
    console.log(`  ${modeLabel}  "${entry.title}" (${entry.level})`)

    const result = await applyEntry(supabase, entry, moduleCache, unitCache, conceptCache, dryRun)

    if (result.failed) {
      failed++
    } else {
      succeeded++
      totalInserted += result.inserted
      if (!dryRun) {
        console.log(`    ✅ Inserted ${result.inserted} exercise(s)`)
      }
    }
  }

  console.log('\n─────────────────────────────────────────')
  if (dryRun) {
    console.log('✅ Dry run complete — no changes made')
  } else {
    console.log(`✅ Succeeded: ${succeeded} concepts (${totalInserted} exercises)`)
    console.log(`❌ Failed:    ${failed} concepts`)
    if (failed === 0) {
      console.log('\n💡 Run pnpm annotate to fill in any null annotations')
    }
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
