/**
 * ARCH-02: Offline grading model validation.
 *
 * Grades 50 real exercise attempts from the DB with claude-haiku and compares
 * to the original Sonnet scores stored in exercise_attempts.ai_score.
 *
 * Gate: exact score agreement >= 90% is required before switching production
 * routes to GRADE_MODEL.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... \
 *   pnpm validate:grading
 *
 * Output: docs/grading-model-validation-YYYY-MM-DD.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { gradeAnswer } from '../src/lib/claude/grader'
import { GRADE_MODEL } from '../src/lib/claude/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const EXERCISE_TYPES = ['gap_fill', 'translation', 'transformation', 'error_correction', 'sentence_builder'] as const
const SAMPLES_PER_TYPE = 12 // aim for ~60 total, trimmed to 50 if needed
const AGREEMENT_THRESHOLD = 0.9

type AttemptRow = {
  id: string
  user_answer: string
  ai_score: number
  exercise_id: string
}

type ExerciseRow = {
  id: string
  type: string
  prompt: string
  expected_answer: string | null
  concept_id: string
}

type ConceptRow = {
  id: string
  title: string
  explanation: string
}

type ValidationResult = {
  attempt_id: string
  exercise_type: string
  user_answer: string
  sonnet_score: number
  haiku_score: number
  score_delta: number
  exact_match: boolean
  near_match: boolean
  haiku_feedback: string
  haiku_corrected_version: string
  error?: string
}

async function fetchSamples(): Promise<Array<{ attempt: AttemptRow; exercise: ExerciseRow; concept: ConceptRow }>> {
  const samples: Array<{ attempt: AttemptRow; exercise: ExerciseRow; concept: ConceptRow }> = []

  for (const type of EXERCISE_TYPES) {
    // Fetch attempts for this exercise type, joining through exercise
    const { data: attempts, error: attErr } = await supabase
      .from('exercise_attempts')
      .select('id, user_answer, ai_score, exercise_id')
      .not('exercise_id', 'is', null)
      .not('ai_score', 'is', null)
      .limit(SAMPLES_PER_TYPE * 3) // over-fetch to allow for filtering

    if (attErr || !attempts || attempts.length === 0) {
      console.warn(`No attempts found — skipping (type sampled later via exercise join)`)
      continue
    }

    const exerciseIds = [...new Set((attempts as AttemptRow[]).map((a) => a.exercise_id))]

    // Fetch exercises of the target type
    const { data: exercises, error: exErr } = await supabase
      .from('exercises')
      .select('id, type, prompt, expected_answer, concept_id')
      .in('id', exerciseIds)
      .eq('type', type)
      .limit(SAMPLES_PER_TYPE)

    if (exErr || !exercises || exercises.length === 0) continue

    const conceptIds = [...new Set((exercises as ExerciseRow[]).map((e) => e.concept_id))]

    const { data: concepts, error: cErr } = await supabase
      .from('concepts')
      .select('id, title, explanation')
      .in('id', conceptIds)

    if (cErr || !concepts) continue

    const exerciseMap = new Map((exercises as ExerciseRow[]).map((e) => [e.id, e]))
    const conceptMap = new Map((concepts as ConceptRow[]).map((c) => [c.id, c]))

    for (const attempt of attempts as AttemptRow[]) {
      const exercise = exerciseMap.get(attempt.exercise_id)
      if (!exercise) continue
      const concept = conceptMap.get(exercise.concept_id)
      if (!concept) continue

      samples.push({ attempt, exercise, concept })
      if (samples.filter((s) => s.exercise.type === type).length >= SAMPLES_PER_TYPE) break
    }
  }

  // Trim to 50 total, keeping type diversity
  return samples.slice(0, 50)
}

async function runValidation(): Promise<void> {
  console.log(`\nARCH-02 grading model validation`)
  console.log(`Candidate model: ${GRADE_MODEL}`)
  console.log(`Agreement threshold: ${AGREEMENT_THRESHOLD * 100}%\n`)

  console.log('Fetching exercise attempt samples...')
  const samples = await fetchSamples()
  console.log(`Fetched ${samples.length} samples across exercise types\n`)

  if (samples.length === 0) {
    console.error('No samples fetched — check DB connection and that exercise_attempts rows exist.')
    process.exit(1)
  }

  const results: ValidationResult[] = []
  let processed = 0

  for (const { attempt, exercise, concept } of samples) {
    process.stdout.write(`\rGrading ${++processed}/${samples.length}...`)

    const result: ValidationResult = {
      attempt_id: attempt.id,
      exercise_type: exercise.type,
      user_answer: attempt.user_answer,
      sonnet_score: attempt.ai_score,
      haiku_score: -1,
      score_delta: 0,
      exact_match: false,
      near_match: false,
      haiku_feedback: '',
      haiku_corrected_version: '',
    }

    try {
      const graded = await gradeAnswer({
        conceptTitle: concept.title,
        conceptExplanation: concept.explanation,
        exerciseType: exercise.type,
        prompt: exercise.prompt,
        expectedAnswer: exercise.expected_answer,
        userAnswer: attempt.user_answer,
        model: GRADE_MODEL,
      })

      result.haiku_score = graded.score
      result.score_delta = Math.abs(graded.score - attempt.ai_score)
      result.exact_match = graded.score === attempt.ai_score
      result.near_match = result.score_delta <= 1
      result.haiku_feedback = graded.feedback
      result.haiku_corrected_version = graded.corrected_version
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err)
    }

    results.push(result)

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log('\n')

  // Compute statistics
  const graded = results.filter((r) => r.haiku_score >= 0)
  const exactMatches = graded.filter((r) => r.exact_match).length
  const nearMatches = graded.filter((r) => r.near_match).length
  const errors = results.filter((r) => r.error).length
  const agreementRate = graded.length > 0 ? exactMatches / graded.length : 0
  const nearAgreementRate = graded.length > 0 ? nearMatches / graded.length : 0

  // Per-type breakdown
  const byType: Record<string, { total: number; exact: number; near: number }> = {}
  for (const r of graded) {
    if (!byType[r.exercise_type]) byType[r.exercise_type] = { total: 0, exact: 0, near: 0 }
    byType[r.exercise_type].total++
    if (r.exact_match) byType[r.exercise_type].exact++
    if (r.near_match) byType[r.exercise_type].near++
  }

  // Score distribution of disagreements
  const disagreements = graded.filter((r) => !r.exact_match).map((r) => ({
    attempt_id: r.attempt_id,
    type: r.exercise_type,
    sonnet: r.sonnet_score,
    haiku: r.haiku_score,
    delta: r.score_delta,
    user_answer: r.user_answer.slice(0, 120),
  }))

  const passed = agreementRate >= AGREEMENT_THRESHOLD

  const report = {
    run_at: new Date().toISOString(),
    candidate_model: GRADE_MODEL,
    baseline_model: 'claude-sonnet-4-20250514',
    total_samples: samples.length,
    graded: graded.length,
    errors,
    exact_agreement_rate: agreementRate,
    near_agreement_rate: nearAgreementRate,
    gate_threshold: AGREEMENT_THRESHOLD,
    gate_passed: passed,
    by_exercise_type: byType,
    disagreements,
    all_results: results,
  }

  // Write report
  const date = new Date().toISOString().split('T')[0]
  const outPath = path.join(process.cwd(), 'docs', `grading-model-validation-${date}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  // Summary
  console.log('─────────────────────────────────────')
  console.log(`Samples graded:      ${graded.length} / ${samples.length}`)
  console.log(`Errors:              ${errors}`)
  console.log(`Exact agreement:     ${(agreementRate * 100).toFixed(1)}%`)
  console.log(`Near agreement (±1): ${(nearAgreementRate * 100).toFixed(1)}%`)
  console.log(`Gate (≥${AGREEMENT_THRESHOLD * 100}%):         ${passed ? '✅ PASSED' : '❌ FAILED'}`)
  console.log('─────────────────────────────────────')
  console.log('\nPer-type breakdown:')
  for (const [type, stats] of Object.entries(byType)) {
    const pct = stats.total > 0 ? ((stats.exact / stats.total) * 100).toFixed(0) : 'n/a'
    console.log(`  ${type.padEnd(20)} ${stats.exact}/${stats.total} exact (${pct}%)`)
  }
  console.log(`\nFull report: ${outPath}`)

  if (passed) {
    console.log('\n✅ ARCH-02 safe to deploy: switch grader.ts + hint/route.ts to GRADE_MODEL.\n')
  } else {
    console.log('\n❌ Do NOT switch model — agreement below threshold. Review disagreements in the report.\n')
    process.exit(1)
  }
}

runValidation().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
