import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswerStream } from '@/lib/claude/grader'
import type { ScoreChunk, DetailsChunk } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, Exercise, UserProgress } from '@/lib/supabase/types'
import { PRODUCTION_TYPES } from '@/lib/mastery/computeLevel'
import { PRODUCTION_CORRECT_REQUIRED, PRODUCTION_TYPES_REQUIRED } from '@/lib/mastery/badge'
import { checkRateLimit } from '@/lib/rate-limit'
import { updateStreakIfNeeded, updateComputedLevel, validateOrigin } from '@/lib/api-utils'
import { MASTERY_THRESHOLD, HARD_INTERVAL_MULTIPLIER } from '@/lib/constants'
import { userLocalToday } from '@/lib/timezone'
import { getCached } from '@/lib/cache'
import * as Sentry from '@sentry/nextjs'

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

    const parsed = SubmitSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { exercise_id, concept_id, user_answer, skip_srs } = parsed.data

    // Item 2: Parallelise rate-limit check with exercise+concept fetch
    const [rateLimitResult, exerciseResult, conceptResult] = await Promise.all([
      checkRateLimit(user.id, 'submit', { maxRequests: 60, windowMs: 10 * 60 * 1000 }),
      // Item 15: Cache exercise rows (static curriculum data, 5-min TTL)
      getCached(`exercise:${exercise_id}`, () =>
        supabase
          .from('exercises')
          .select('id, type, prompt, expected_answer, answer_variants, concept_id, annotations, hint_1, hint_2')
          .eq('id', exercise_id)
          .eq('concept_id', concept_id)
          .single()
          .then(r => r as { data: Exercise | null; error: unknown }),
      ),
      // Item 15: Cache concept rows (static curriculum data, 5-min TTL)
      getCached(`concept:${concept_id}`, () =>
        supabase
          .from('concepts')
          .select('id, title, explanation, level, type, difficulty, grammar_focus, unit_id, examples')
          .eq('id', concept_id)
          .single()
          .then(r => r as { data: Concept | null; error: unknown }),
      ),
    ])

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const { data: exercise, error: exErr } = exerciseResult
    const { data: concept, error: conceptErr } = conceptResult

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
      // Item 4: Pass answer_variants to Claude prompt
      answerVariants: (typedExercise as Exercise & { answer_variants?: string[] | null }).answer_variants,
    })

    // Item 1: Pre-fetch SRS data + production breadth in parallel with Claude call
    const srsDataPromise = !skip_srs
      ? Promise.all([
          supabase
            .from('user_progress')
            .select('ease_factor, interval_days, repetitions, due_date, production_mastered, is_hard')
            .eq('user_id', user.id)
            .eq('concept_id', concept_id)
            .single(),
          supabase
            .from('profiles')
            .select('timezone')
            .eq('id', user.id)
            .single(),
          // Fetch non-gap_fill exercises for this concept (for production breadth check)
          supabase
            .from('exercises')
            .select('id, type')
            .eq('concept_id', concept_id)
            .neq('type', 'gap_fill'),
        ])
      : null

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
          let productionReady = false
          let existingProductionMastered = false

          if (!skip_srs && srsDataPromise) {
            // Item 1: Await the already-in-flight SRS promises
            const [{ data: existingProgress }, { data: profileTz }, { data: nonGapFillExercises }] = await srsDataPromise
            existingProductionMastered = existingProgress?.production_mastered ?? false

            const timezone = (profileTz as { timezone: string | null } | null)?.timezone ?? null
            const prevIntervalDays = existingProgress?.interval_days ?? 0

            const currentProgress = existingProgress ?? {
              ...DEFAULT_PROGRESS,
              user_id: user.id,
              concept_id,
            }

            // Calculate new SRS values
            const newSRS = sm2(currentProgress as Pick<UserProgress, 'ease_factor' | 'interval_days' | 'repetitions'>, score as SRSScore, timezone)

            // Build production breadth check: query correct attempts on non-gap_fill exercises
            type NonGapFillExRow = { id: string; type: string }
            const nonGapFillExRows = (nonGapFillExercises ?? []) as NonGapFillExRow[]
            const nonGapFillIds = nonGapFillExRows.map(e => e.id)
            const exerciseTypeMap = new Map(nonGapFillExRows.map(e => [e.id, e.type]))

            let correctNonGapFill = 0
            const correctTypes = new Set<string>()

            if (nonGapFillIds.length > 0) {
              const { data: correctAttempts } = await supabase
                .from('exercise_attempts')
                .select('exercise_id')
                .eq('user_id', user.id)
                .in('exercise_id', nonGapFillIds)
                .eq('is_correct', true)

              for (const att of (correctAttempts ?? []) as { exercise_id: string }[]) {
                correctNonGapFill++
                const t = exerciseTypeMap.get(att.exercise_id)
                if (t) correctTypes.add(t)
              }
            }

            // Include the current attempt in the production breadth count
            if (isProductionType && is_correct) {
              correctNonGapFill++
              correctTypes.add(typedExercise.type)
            }

            productionReady =
              correctNonGapFill >= PRODUCTION_CORRECT_REQUIRED &&
              correctTypes.size >= PRODUCTION_TYPES_REQUIRED

            // Check mastery BEFORE applying hard-flag multiplier — requires both SRS + production breadth
            const srsThresholdCrossed = prevIntervalDays < MASTERY_THRESHOLD && newSRS.interval_days >= MASTERY_THRESHOLD
            justMastered = srsThresholdCrossed && productionReady

            // Apply hard-flag multiplier on correct answers to schedule ~40% more frequently
            if (existingProgress?.is_hard && score >= 2) {
              newSRS.interval_days = Math.max(1, Math.round(newSRS.interval_days * HARD_INTERVAL_MULTIPLIER))
              const todayStr = userLocalToday(timezone)
              const due = new Date(todayStr + 'T00:00:00Z')
              due.setUTCDate(due.getUTCDate() + newSRS.interval_days)
              newSRS.due_date = due.toISOString().split('T')[0]
            }

            nextReviewInDays = newSRS.interval_days

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
            // Set production_mastered when breadth gate is met (≥3 correct, ≥2 types)
            if (productionReady && !existingProductionMastered) {
              bgOps.push(
                supabase
                  .from('user_progress')
                  .update({ production_mastered: true })
                  .eq('user_id', user.id)
                  .eq('concept_id', concept_id),
              )
            }
            bgOps.push(updateComputedLevel(supabase, user.id, { justMastered }))
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
    Sentry.captureException(err)
    console.error('[submit] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
