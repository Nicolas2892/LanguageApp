import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Concept, Exercise, Unit, UserProgress } from '@/lib/supabase/types'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'
import * as Sentry from '@sentry/nextjs'

/**
 * GET /api/offline/module/[id]
 *
 * Returns a JSON bundle with all data needed to study a module offline:
 * - module metadata
 * - units, concepts, exercises (excluding `listening` type)
 * - user_progress snapshot for these concepts
 *
 * Free-write prompts are not included — they require Claude and are
 * only available online. The free_write_prompts array is always empty.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: moduleId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 10 downloads per 10 minutes (no Claude calls now, just DB queries)
    const rl = await checkRateLimit(user.id, 'offline-module-download', {
      maxRequests: 10,
      windowMs: 10 * 60 * 1000,
    })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

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

    // Fetch exercises (exclude listening — requires TTS) and user progress in parallel
    const [{ data: rawExercises }, { data: rawProgress }] = await Promise.all([
      supabase
        .from('exercises')
        .select('id, concept_id, type, prompt, expected_answer, answer_variants, hint_1, hint_2, annotations, source, created_at')
        .in('concept_id', conceptIds)
        .neq('type', 'listening'),
      supabase
        .from('user_progress')
        .select('concept_id, ease_factor, interval_days, due_date, repetitions, production_mastered, is_hard')
        .eq('user_id', user.id)
        .in('concept_id', conceptIds),
    ])

    const exercises = (rawExercises ?? []) as Exercise[]
    const userProgress = (rawProgress ?? []) as Pick<
      UserProgress,
      'concept_id' | 'ease_factor' | 'interval_days' | 'due_date' | 'repetitions' | 'production_mastered' | 'is_hard'
    >[]

    return NextResponse.json({
      module: moduleData,
      units,
      concepts,
      exercises,
      user_progress: userProgress,
      free_write_prompts: [],
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
