import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, UserProgress } from '@/lib/supabase/types'
import { checkRateLimit } from '@/lib/rate-limit'
import { updateStreakIfNeeded, updateComputedLevel } from '@/lib/api-utils'

const GradeSchema = z.object({
  concept_ids: z.array(z.string().uuid()).min(1).max(5),
  ai_prompt: z.string().min(1).max(2000),
  user_answer: z.string().min(1).max(2000),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 20 requests per 10 minutes per user
    if (!checkRateLimit(user.id, 'grade', { maxRequests: 20, windowMs: 10 * 60 * 1000 }).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = GradeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { concept_ids, ai_prompt, user_answer } = parsed.data

    // 1. Fetch all concepts (explicit columns)
    const { data: concepts, error: conceptErr } = await supabase
      .from('concepts')
      .select('id, title, explanation, level')
      .in('id', concept_ids)

    if (conceptErr || !concepts || concepts.length === 0) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }
    const typedConcepts = concepts as Pick<Concept, 'id' | 'title' | 'explanation' | 'level'>[]

    const conceptTitles = typedConcepts.map((c) => c.title).join(', ')
    const conceptExplanations = typedConcepts.map((c) => `${c.title}: ${c.explanation}`).join('\n')

    // 2. Grade with Claude (holistic score across all concepts)
    const gradeResult = await gradeAnswer({
      conceptTitle: conceptTitles,
      conceptExplanation: conceptExplanations,
      exerciseType: 'free_write',
      prompt: ai_prompt,
      expectedAnswer: null,
      userAnswer: user_answer,
    })

    // 3. Batch-fetch all user_progress rows for this user + these concepts
    const { data: progressRows } = await supabase
      .from('user_progress')
      .select('concept_id, ease_factor, interval_days, repetitions, due_date, production_mastered')
      .eq('user_id', user.id)
      .in('concept_id', concept_ids)

    const progressMap = new Map(
      (progressRows as Pick<UserProgress, 'concept_id' | 'ease_factor' | 'interval_days' | 'repetitions' | 'due_date' | 'production_mastered'>[] ?? [])
        .map((r) => [r.concept_id, r])
    )

    // 4. Upsert user_progress for each concept with the same holistic score
    for (const concept_id of concept_ids) {
      const existing = progressMap.get(concept_id) ?? null
      const currentProgress = existing ?? {
        ...DEFAULT_PROGRESS,
        user_id: user.id,
        concept_id,
      }

      const newSRS = sm2(currentProgress as Pick<UserProgress, 'ease_factor' | 'interval_days' | 'repetitions'>, gradeResult.score as SRSScore)

      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          concept_id,
          ease_factor: newSRS.ease_factor,
          interval_days: newSRS.interval_days,
          due_date: newSRS.due_date,
          repetitions: newSRS.repetitions,
          last_reviewed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,concept_id' })

      // free_write is Tier 3 — always counts as production evidence
      if (gradeResult.score >= 2) {
        await supabase
          .from('user_progress')
          .update({ production_mastered: true })
          .eq('user_id', user.id)
          .eq('concept_id', concept_id)
      }
    }

    // 5. Recompute and persist the user's CEFR level after all upserts
    await updateComputedLevel(supabase, user.id)

    // Use the first concept's SRS for the response (for next_review_in_days display)
    const { data: firstProgress } = await supabase
      .from('user_progress')
      .select('interval_days')
      .eq('user_id', user.id)
      .eq('concept_id', concept_ids[0])
      .single()
    const nextReviewDays = (firstProgress as { interval_days: number } | null)?.interval_days ?? 1

    // 6. Record the attempt (exercise_id is null for AI-generated prompts)
    await supabase
      .from('exercise_attempts')
      .insert({
        user_id: user.id,
        exercise_id: null,
        user_answer,
        is_correct: gradeResult.is_correct,
        ai_score: gradeResult.score,
        ai_feedback: gradeResult.feedback,
      })

    // 7. Update streak atomically — once per day
    await updateStreakIfNeeded(supabase, user.id)

    return NextResponse.json({
      ...gradeResult,
      next_review_in_days: nextReviewDays,
    })
  } catch (err) {
    console.error('[grade] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
