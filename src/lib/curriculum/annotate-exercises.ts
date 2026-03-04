/**
 * Annotate all unannotated exercises with grammatical span data via Claude.
 * Processes in batches of 10 (rate limit safety).
 *
 * Usage: see run-annotate.ts
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { Database, Exercise, AnnotationSpan } from '../supabase/types'

const BATCH_SIZE = 10

function buildAnnotationPrompt(prompt: string): string {
  return `You are a Spanish grammar expert. Split this exercise prompt into spans and identify subjunctive verb forms.

Return ONLY valid JSON, no markdown:
{
  "spans": [
    { "text": "...", "form": null },
    { "text": "vengas", "form": "subjunctive" }
  ]
}

Rules:
- Spans must cover every character of the prompt (concatenated = original text, exactly)
- form: "subjunctive" — conjugated present or imperfect subjunctive verb forms only
- form: "indicative" — conjugated indicative verb forms (use sparingly for clear pedagogical contrast)
- form: null — everything else (nouns, conjunctions, blanks, punctuation, ___ tokens)
- ___ tokens in gap-fill prompts → form: null

Prompt:
"${prompt}"`
}

export async function annotateExercises(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!anthropicKey) {
    throw new Error('Missing ANTHROPIC_API_KEY')
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)
  const anthropic = new Anthropic({ apiKey: anthropicKey })

  // Fetch all exercises with null annotations
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .is('annotations', null)

  if (error) throw new Error(`Failed to fetch exercises: ${error.message}`)
  if (!exercises || exercises.length === 0) {
    console.log('No unannotated exercises found.')
    return
  }

  const typedExercises = exercises as Exercise[]
  const total = typedExercises.length
  console.log(`Found ${total} unannotated exercises. Processing in batches of ${BATCH_SIZE}...\n`)

  let annotated = 0

  for (let i = 0; i < typedExercises.length; i += BATCH_SIZE) {
    const batch = typedExercises.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (exercise) => {
        try {
          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: buildAnnotationPrompt(exercise.prompt) }],
          })

          const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
          let parsed: { spans: AnnotationSpan[] }
          try {
            parsed = JSON.parse(raw)
          } catch {
            console.warn(`  ⚠️  Exercise ${exercise.id}: JSON parse failed, skipping`)
            return
          }

          if (!Array.isArray(parsed.spans)) {
            console.warn(`  ⚠️  Exercise ${exercise.id}: spans not an array, skipping`)
            return
          }

          // Validate concatenated spans equal original prompt
          const concatenated = parsed.spans.map((s) => s.text).join('')
          if (concatenated !== exercise.prompt) {
            console.warn(
              `  ⚠️  Exercise ${exercise.id}: span concat mismatch\n` +
              `       expected: ${JSON.stringify(exercise.prompt)}\n` +
              `       got:      ${JSON.stringify(concatenated)}\n` +
              `       skipping annotation`
            )
            return
          }

          const { error: updateErr } = await supabase
            .from('exercises')
            .update({ annotations: parsed.spans })
            .eq('id', exercise.id)

          if (updateErr) {
            console.warn(`  ⚠️  Exercise ${exercise.id}: update failed: ${updateErr.message}`)
            return
          }

          annotated++
          console.log(`  ✅ Annotated ${annotated} / ${total} (id: ${exercise.id.slice(0, 8)}…)`)
        } catch (err) {
          console.warn(`  ⚠️  Exercise ${exercise.id}: unexpected error:`, err)
        }
      })
    )
  }

  console.log(`\n🎉 Done! Annotated ${annotated} / ${total} exercises.`)
}
