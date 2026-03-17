import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import type { Concept, Exercise, Unit, UserProgress } from '@/lib/supabase/types'
import * as Sentry from '@sentry/nextjs'

/**
 * GET /api/offline/module/[id]
 *
 * Returns a JSON bundle with all data needed to study a module offline:
 * - module metadata
 * - units, concepts, exercises (excluding `listening` type)
 * - user_progress snapshot for these concepts
 * - pre-generated free-write prompts (one per concept, via Claude)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: moduleId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch module
    const { data: mod, error: modErr } = await supabase
      .from('modules')
      .select('id, title, order_index')
      .eq('id', moduleId)
      .single()
    if (modErr || !mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }
    const moduleData = mod as { id: string; title: string; order_index: number }

    // Fetch units for module
    const { data: rawUnits } = await supabase
      .from('units')
      .select('id, module_id, title, order_index')
      .eq('module_id', moduleId)
      .order('order_index')
    const units = (rawUnits ?? []) as Pick<Unit, 'id' | 'module_id' | 'title' | 'order_index'>[]

    const unitIds = units.map(u => u.id)
    if (unitIds.length === 0) {
      return NextResponse.json({
        module: moduleData,
        units: [],
        concepts: [],
        exercises: [],
        user_progress: [],
        free_write_prompts: [],
        version: Date.now(),
      })
    }

    // Fetch concepts for these units
    const { data: rawConcepts } = await supabase
      .from('concepts')
      .select('id, unit_id, type, title, explanation, examples, difficulty, level, grammar_focus')
      .in('unit_id', unitIds)
      .order('difficulty')
    const concepts = (rawConcepts ?? []) as Concept[]

    const conceptIds = concepts.map(c => c.id)

    // Fetch exercises (exclude listening — requires TTS)
    const { data: rawExercises } = await supabase
      .from('exercises')
      .select('id, concept_id, type, prompt, expected_answer, answer_variants, hint_1, hint_2, annotations, source, created_at')
      .in('concept_id', conceptIds)
      .neq('type', 'listening')
    const exercises = (rawExercises ?? []) as Exercise[]

    // Fetch user progress for these concepts
    const { data: rawProgress } = await supabase
      .from('user_progress')
      .select('concept_id, ease_factor, interval_days, due_date, repetitions, production_mastered, is_hard')
      .eq('user_id', user.id)
      .in('concept_id', conceptIds)
    const userProgress = (rawProgress ?? []) as Pick<
      UserProgress,
      'concept_id' | 'ease_factor' | 'interval_days' | 'due_date' | 'repetitions' | 'production_mastered' | 'is_hard'
    >[]

    // Generate free-write prompts for each concept (limit concurrency to 3)
    const freeWritePrompts = await generatePromptsWithConcurrency(concepts, 3)

    return NextResponse.json({
      module,
      units,
      concepts,
      exercises,
      user_progress: userProgress,
      free_write_prompts: freeWritePrompts,
      version: Date.now(),
    }, {
      headers: { 'Cache-Control': 'private, max-age=1800' },
    })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[offline/module] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generatePromptsWithConcurrency(
  concepts: Concept[],
  concurrency: number,
): Promise<Array<{ concept_id: string; prompt: string }>> {
  const results: Array<{ concept_id: string; prompt: string }> = []
  const queue = [...concepts]

  async function worker() {
    while (queue.length > 0) {
      const concept = queue.shift()!
      try {
        const message = await anthropic.messages.create({
          model: TUTOR_MODEL,
          max_tokens: 256,
          system: `You are a creative Spanish writing coach for B1→B2 learners. Generate short, engaging writing prompts that require the student to actively use specific grammar concepts. Keep prompts concrete and relatable to daily life. The student should aim for 150–200 words. Respond with only the prompt text — no labels, no preamble, no quotes.`,
          messages: [{
            role: 'user',
            content: `Grammar concept to practice:\n- ${concept.title}: ${concept.explanation}\n\nWrite a single relatable writing prompt (a realistic scenario: personal opinion, letter, or short narrative) that requires the student to use this concept naturally in 150–200 words. Do not mention the grammar rules explicitly in the prompt.`,
          }],
        })
        const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
        results.push({ concept_id: concept.id, prompt: text })
      } catch (err) {
        console.error(`[offline/module] prompt gen failed for ${concept.id}:`, err)
        results.push({ concept_id: concept.id, prompt: '' })
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}
