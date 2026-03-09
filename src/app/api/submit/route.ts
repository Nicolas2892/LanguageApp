import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswerStream } from '@/lib/claude/grader'
import type { ScoreChunk, DetailsChunk } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, Exercise, UserProgress } from '@/lib/supabase/types'
import { PRODUCTION_TYPES } from '@/lib/mastery/computeLevel'
import { checkRateLimit } from '@/lib/rate-limit'
import { updateStreakIfNeeded, updateComputedLevel, validateOrigin } from '@/lib/api-utils'
import { MASTERY_THRESHOLD, HARD_INTERVAL_MULTIPLIER } from '@/lib/constants'

const SubmitSchema = z.object({
  exercise_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  user_answer: z.string().min(1).max(1000),
  skip_srs: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 60 requests per 10 minutes per user
    if (!(await checkRateLimit(user.id, 'submit', { maxRequests: 60, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = SubmitSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { exercise_id, concept_id, user_answer, skip_srs } = parsed.data

    // 1. Fetch exercise + concept in parallel (2 concurrent queries, no join syntax risk)
    const [
      { data: exercise, error: exErr },
      { data: concept, error: conceptErr },
    ] = await Promise.all([
      supabase
        .from('exercises')
        .select('id, type, prompt, expected_answer, concept_id, annotations, hint_1, hint_2')
        .eq('id', exercise_id)
        .eq('concept_id', concept_id)
        .single(),
      supabase
        .from('concepts')
        .select('id, title, explanation, level, type, difficulty, grammar_focus, unit_id, examples')
        .eq('id', concept_id)
        .single(),
    ])

    if (exErr || !exercise) return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    if (conceptErr || !concept) return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    const typedExercise = exercise as Exercise
    const typedConcept = concept as Concept

    // 2. Start streaming grade response
    const gradeGen = gradeAnswerStream({
      conceptTitle: typedConcept.title,
      conceptExplanation: typedConcept.explanation,
      exerciseType: typedExercise.type,
      prompt: typedExercise.prompt,
      expectedAnswer: typedExercise.expected_answer,
      userAnswer: user_answer,
    })

    const encoder = new TextEncoder()
    const isProductionType = (PRODUCTION_TYPES as readonly string[]).includes(typedExercise.type)

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // --- Chunk 1: score + SRS ---
          const scoreResult = await gradeGen.next()
          const { score, is_correct } = scoreResult.value as ScoreChunk

          let nextReviewInDays = 0
          let justMastered = false

          if (!skip_srs) {
            // Fetch current user_progress (or use defaults if first time)
            const { data: existingProgress } = await supabase
              .from('user_progress')
              .select('ease_factor, interval_days, repetitions, due_date, production_mastered, is_hard')
              .eq('user_id', user.id)
              .eq('concept_id', concept_id)
              .single()

            const prevIntervalDays = existingProgress?.interval_days ?? 0

            const currentProgress = existingProgress ?? {
              ...DEFAULT_PROGRESS,
              user_id: user.id,
              concept_id,
            }

            // Calculate new SRS values
            const newSRS = sm2(currentProgress as Pick<UserProgress, 'ease_factor' | 'interval_days' | 'repetitions'>, score as SRSScore)

            // Apply hard-flag multiplier on correct answers to schedule ~40% more frequently
            if (existingProgress?.is_hard && score >= 2) {
              newSRS.interval_days = Math.max(1, Math.round(newSRS.interval_days * HARD_INTERVAL_MULTIPLIER))
              const due = new Date()
              due.setDate(due.getDate() + newSRS.interval_days)
              newSRS.due_date = due.toISOString().split('T')[0]
            }

            nextReviewInDays = newSRS.interval_days
            justMastered = prevIntervalDays < MASTERY_THRESHOLD && newSRS.interval_days >= MASTERY_THRESHOLD

            // Upsert user_progress before emitting chunk 1
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
          }

          controller.enqueue(encoder.encode(JSON.stringify({
            score,
            is_correct,
            next_review_in_days: nextReviewInDays,
            just_mastered: justMastered,
            mastered_concept_title: justMastered ? typedConcept.title : null,
          }) + '\n'))

          // --- Chunk 2: feedback details ---
          const detailsResult = await gradeGen.next()
          const { feedback, corrected_version, explanation } = detailsResult.value as DetailsChunk

          controller.enqueue(encoder.encode(JSON.stringify({ feedback, corrected_version, explanation }) + '\n'))

          controller.close()

          // Fire-and-forget: record attempt + streak + production_mastered + computed level
          const bgOps: PromiseLike<unknown>[] = [
            supabase.from('exercise_attempts').insert({
              user_id: user.id,
              exercise_id,
              user_answer,
              is_correct,
              ai_score: score,
              ai_feedback: feedback,
            }),
            updateStreakIfNeeded(supabase, user.id),
          ]
          if (!skip_srs) {
            if (isProductionType && score >= 2) {
              bgOps.push(
                supabase
                  .from('user_progress')
                  .update({ production_mastered: true })
                  .eq('user_id', user.id)
                  .eq('concept_id', concept_id),
              )
            }
            bgOps.push(updateComputedLevel(supabase, user.id))
          }
          Promise.all(bgOps).catch(console.error)
        } catch (err) {
          console.error('[submit] stream error:', err)
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[submit] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
