/**
 * AI-powered curriculum seed script.
 *
 * Generates exercises for all concepts in CURRICULUM_PLAN that are missing them.
 * - New concepts: generates explanation, examples, and 9 exercises (3 per type)
 * - Existing concepts: queries DB for current exercise counts per type,
 *   generates only the missing exercises (top-up to 3 per type)
 *
 * Writes incrementally — safe to kill and re-run; already-generated concepts are skipped.
 * Output file: docs/curriculum-review-YYYY-MM-DD.json (or --output <path>)
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... \
 *   pnpm seed:ai [--output <path>]
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { CURRICULUM_PLAN } from './curriculum-plan'
import { EXERCISE_GENERATION_RULES, EXERCISES_PER_TYPE } from './ai-seed-config'
import type { ExerciseType, CefrLevel } from './ai-seed-config'
import type { ConceptPlan } from './curriculum-plan'

// ─── Env validation ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-20250514'
const DELAY_MS = 300

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnnotationSpan {
  text: string
  form: 'subjunctive' | 'indicative' | null
}

interface ReviewExercise {
  type: ExerciseType
  prompt: string
  expected_answer: string
  hint_1: string
  hint_2: string
  annotations: AnnotationSpan[] | null
}

interface ReviewConcept {
  title: string
  module: string
  unit: string
  level: CefrLevel
  grammar_focus: string
  difficulty: number
  type: string
  explanation: string | null
  examples: Array<{ es: string; en: string }> | null
  exercises: ReviewExercise[]
  _mode: 'new' | 'topup'
  _generatedAt: string
  _approved: boolean
  _notes: string
  _annotationsValid: boolean
}

interface DbExerciseRow {
  type: string
  concept_id: string
}

interface DbConceptRow {
  id: string
  title: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs(): { outputPath: string } {
  const args = process.argv.slice(2)
  const outIdx = args.indexOf('--output')
  if (outIdx !== -1 && args[outIdx + 1]) {
    return { outputPath: args[outIdx + 1] }
  }
  const dateStr = new Date().toISOString().slice(0, 10)
  return { outputPath: path.join(process.cwd(), 'docs', `curriculum-review-${dateStr}.json`) }
}

/** Load existing results from file; return empty array if file doesn't exist. */
function loadExisting(filePath: string): ReviewConcept[] {
  if (!fs.existsSync(filePath)) return []
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ReviewConcept[]
  } catch {
    console.warn(`⚠️  Could not parse existing file at ${filePath} — starting fresh`)
    return []
  }
}

/** Overwrite the output file with the full results array. */
function saveResults(filePath: string, results: ReviewConcept[]): void {
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8')
}

function buildNewConceptPrompt(plan: ConceptPlan, exercisesNeeded: Array<{ type: ExerciseType; count: number }>): string {
  const exerciseList = exercisesNeeded
    .map(({ type, count }) => `- ${count}× ${type}: ${EXERCISE_GENERATION_RULES[type]}`)
    .join('\n')

  return `You are an expert Spanish language exercise author creating content for B1→B2→C1 learners (Español Avanzado app).

Concept: "${plan.title}"
Level: ${plan.level}
Grammar focus: ${plan.grammar_focus}
Context: ${plan.description}

Return ONLY valid JSON (no markdown, no commentary) in this exact structure:
{
  "explanation": "2–3 sentence explanation of the concept: what it is, when to use it, key distinctions",
  "examples": [
    { "es": "...", "en": "..." },
    { "es": "...", "en": "..." },
    { "es": "...", "en": "..." }
  ],
  "exercises": [
    {
      "type": "gap_fill|transformation|translation|error_correction|free_write",
      "prompt": "...",
      "expected_answer": "...",
      "hint_1": "...",
      "hint_2": "...",
      "annotations": [{ "text": "...", "form": null }]
    }
  ]
}

ANNOTATION RULES (apply to every exercise):
- Split the prompt into spans covering every character (concatenation must equal prompt exactly)
- form: "subjunctive" — conjugated present or imperfect subjunctive verb forms only
- form: "indicative" — conjugated indicative verb forms (use sparingly for pedagogical contrast)
- form: null — everything else (nouns, connectors, blanks, punctuation, ___ tokens)

EXERCISES NEEDED (generate exactly these, in this order):
${exerciseList}

Ensure all exercises use rich, natural Spanish sentences at the ${plan.level} level. Vary vocabulary and contexts across exercises of the same type.`
}

function buildTopupPrompt(plan: ConceptPlan, exercisesNeeded: Array<{ type: ExerciseType; count: number }>): string {
  const exerciseList = exercisesNeeded
    .map(({ type, count }) => `- ${count}× ${type}: ${EXERCISE_GENERATION_RULES[type]}`)
    .join('\n')

  return `You are an expert Spanish language exercise author creating content for B1→B2→C1 learners (Español Avanzado app).

Concept: "${plan.title}"
Level: ${plan.level}
Grammar focus: ${plan.grammar_focus}
Context: ${plan.description}

This concept already has some exercises. Generate ONLY the missing ones listed below.

Return ONLY valid JSON (no markdown, no commentary) in this exact structure:
{
  "exercises": [
    {
      "type": "gap_fill|transformation|translation|error_correction|free_write",
      "prompt": "...",
      "expected_answer": "...",
      "hint_1": "...",
      "hint_2": "...",
      "annotations": [{ "text": "...", "form": null }]
    }
  ]
}

ANNOTATION RULES:
- Split the prompt into spans covering every character (concatenation must equal prompt exactly)
- form: "subjunctive" — conjugated present or imperfect subjunctive verb forms only
- form: "indicative" — conjugated indicative verb forms (sparingly)
- form: null — everything else

EXERCISES NEEDED (generate exactly these, in this order):
${exerciseList}`
}

function validateAnnotations(exercises: ReviewExercise[]): ReviewExercise[] {
  return exercises.map((ex) => {
    if (!Array.isArray(ex.annotations) || ex.annotations.length === 0) {
      return { ...ex, annotations: null }
    }
    const concatenated = ex.annotations.map((s) => s.text).join('')
    if (concatenated !== ex.prompt) {
      console.warn(`    ⚠️  Annotation mismatch for prompt: "${ex.prompt.slice(0, 40)}…" — storing null`)
      return { ...ex, annotations: null }
    }
    return ex
  })
}

function annotationsValid(exercises: ReviewExercise[]): boolean {
  return exercises.every((ex) => ex.annotations !== null)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { outputPath } = parseArgs()

  // Load any partial results from a previous interrupted run
  const results: ReviewConcept[] = loadExisting(outputPath)
  const alreadyGenerated = new Set(results.map((r) => r.title))

  if (alreadyGenerated.size > 0) {
    console.log(`📂 Resuming — ${alreadyGenerated.size} concepts already in ${path.basename(outputPath)}`)
  }

  console.log('🤖 AI Curriculum Seed — generating exercises\n')

  // 1. Fetch all existing concepts from DB
  const { data: existingConcepts, error: conceptsErr } = await supabase
    .from('concepts')
    .select('id, title')

  if (conceptsErr) {
    console.error('❌ Failed to fetch concepts:', conceptsErr.message)
    process.exit(1)
  }

  const conceptsByTitle = new Map<string, string>(
    (existingConcepts as DbConceptRow[]).map((c) => [c.title, c.id])
  )

  // 2. Fetch exercise counts per concept per type
  const { data: exerciseRows, error: exErr } = await supabase
    .from('exercises')
    .select('type, concept_id')

  if (exErr) {
    console.error('❌ Failed to fetch exercises:', exErr.message)
    process.exit(1)
  }

  const exerciseCountMap = new Map<string, Map<string, number>>()
  for (const row of (exerciseRows as DbExerciseRow[])) {
    if (!exerciseCountMap.has(row.concept_id)) {
      exerciseCountMap.set(row.concept_id, new Map())
    }
    const typeMap = exerciseCountMap.get(row.concept_id)!
    typeMap.set(row.type, (typeMap.get(row.type) ?? 0) + 1)
  }

  console.log(`Found ${conceptsByTitle.size} existing concepts in DB`)
  console.log(`Processing ${CURRICULUM_PLAN.length} concepts from CURRICULUM_PLAN`)
  console.log(`Output: ${outputPath}\n`)

  let skipped = 0
  let generated = 0
  let errors = 0

  for (const plan of CURRICULUM_PLAN) {
    // Skip if already generated in a previous run
    if (alreadyGenerated.has(plan.title)) {
      console.log(`  ⏭  Already generated "${plan.title}" — skipping`)
      skipped++
      continue
    }

    const existingId = conceptsByTitle.get(plan.title)
    const isNew = !existingId

    const exercisesNeeded: Array<{ type: ExerciseType; count: number }> = []

    if (isNew) {
      for (const type of plan.exerciseTypes) {
        exercisesNeeded.push({ type, count: EXERCISES_PER_TYPE })
      }
    } else {
      const typeMap = exerciseCountMap.get(existingId!) ?? new Map()
      for (const type of plan.exerciseTypes) {
        const current = typeMap.get(type) ?? 0
        const needed = EXERCISES_PER_TYPE - current
        if (needed > 0) {
          exercisesNeeded.push({ type, count: needed })
        }
      }

      if (exercisesNeeded.length === 0) {
        console.log(`  ⏭  Skipping "${plan.title}" — already has ≥${EXERCISES_PER_TYPE} of each type`)
        skipped++
        continue
      }
    }

    const mode: 'new' | 'topup' = isNew ? 'new' : 'topup'
    const totalNeeded = exercisesNeeded.reduce((sum, e) => sum + e.count, 0)
    console.log(
      `  📝 [${mode.toUpperCase()}] "${plan.title}" — generating ${totalNeeded} exercise(s): ` +
      exercisesNeeded.map((e) => `${e.count}×${e.type}`).join(', ')
    )

    try {
      const prompt = isNew
        ? buildNewConceptPrompt(plan, exercisesNeeded)
        : buildTopupPrompt(plan, exercisesNeeded)

      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

      let parsed: {
        explanation?: string
        examples?: Array<{ es: string; en: string }>
        exercises: ReviewExercise[]
      }

      try {
        parsed = JSON.parse(raw)
      } catch {
        console.error(`    ❌ JSON parse failed for "${plan.title}"`)
        errors++
        await delay(DELAY_MS)
        continue
      }

      if (!Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
        console.error(`    ❌ No exercises in response for "${plan.title}"`)
        errors++
        await delay(DELAY_MS)
        continue
      }

      const exercises = validateAnnotations(parsed.exercises as ReviewExercise[])
      const allAnnotationsValid = annotationsValid(exercises)

      const reviewEntry: ReviewConcept = {
        title: plan.title,
        module: plan.module,
        unit: plan.unit,
        level: plan.level,
        grammar_focus: plan.grammar_focus,
        difficulty: plan.difficulty,
        type: plan.type,
        explanation: isNew ? (parsed.explanation ?? null) : null,
        examples: isNew ? (parsed.examples ?? null) : null,
        exercises,
        _mode: mode,
        _generatedAt: new Date().toISOString(),
        _approved: false,
        _notes: '',
        _annotationsValid: allAnnotationsValid,
      }

      // Append to results array and save immediately (resume-safe)
      results.push(reviewEntry)
      alreadyGenerated.add(plan.title)
      saveResults(outputPath, results)
      generated++

      if (!allAnnotationsValid) {
        console.log(`    ⚠️  Some annotations failed validation — stored null (pnpm annotate will fix)`)
      } else {
        console.log(`    ✅ Generated ${exercises.length} exercise(s) [${results.length} total in file]`)
      }
    } catch (err) {
      console.error(`    ❌ Unexpected error for "${plan.title}":`, err)
      errors++
    }

    await delay(DELAY_MS)
  }

  console.log('\n─────────────────────────────────────────')
  console.log(`✅ Generated: ${generated} concepts this run`)
  console.log(`⏭  Skipped:   ${skipped} concepts (already done)`)
  console.log(`❌ Errors:    ${errors} concepts`)
  console.log(`📄 Total in file: ${results.length} concepts`)
  console.log(`\n📄 Review file: ${outputPath}`)
  console.log('\nNext steps:')
  console.log('  1. node scripts/approve-all.mjs <file>   (to approve all entries)')
  console.log('  2. pnpm seed:ai:apply --dry-run <file>')
  console.log('  3. pnpm seed:ai:apply <file>')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
