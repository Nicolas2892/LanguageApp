import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs/index'
import type { SRSScore } from '@/lib/srs/index'
import { updateStreakIfNeeded, updateComputedLevel, validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import type { GradeResult } from '@/lib/claude/grader'
import type { Concept, UserProgress } from '@/lib/supabase/types'
import * as Sentry from '@sentry/nextjs'

const AttemptSchema = z.object({
  exercise_id: z.string().uuid().nullable(),
  concept_id: z.string().uuid(),
  concept_title: z.string().min(1),
  user_answer: z.string().min(1),
  exercise_type: z.string().min(1),
  exercise_prompt: z.string().min(1),
  expected_answer: z.string().nullable(),
  answer_variants: z.array(z.string()).nullable(),
  attempted_at: z.string(),
})

const BatchSchema = z.object({
  session_id: z.string().min(1),
  attempts: z.array(AttemptSchema).min(1).max(50),
})

const GRADE_CONCURRENCY = 5

/**
 * POST /api/offline/grade-batch
 *
 * Grades a batch of offline attempts via Claude, applies SRS updates
 * sequentially (server-wins conflict resolution), and creates a report.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 5 requests per 10 minutes
    const rl = await checkRateLimit(user.id, 'offline-grade-batch', {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
    })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const parsed = BatchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { session_id, attempts } = parsed.data

    // Fetch all unique concepts in one query
    const conceptIds = [...new Set(attempts.map(a => a.concept_id))]
    const { data: rawConcepts } = await supabase
      .from('concepts')
      .select('id, title, explanation, type')
      .in('id', conceptIds)
    const conceptMap = new Map(
      ((rawConcepts ?? []) as Pick<Concept, 'id' | 'title' | 'explanation' | 'type'>[])
        .map(c => [c.id, c]),
    )

    // Grade all attempts via Claude (parallel batches of GRADE_CONCURRENCY)
    type GradedAttempt = typeof attempts[number] & { grade: GradeResult }
    const graded: GradedAttempt[] = []

    for (let i = 0; i < attempts.length; i += GRADE_CONCURRENCY) {
      const batch = attempts.slice(i, i + GRADE_CONCURRENCY)
      const results = await Promise.all(
        batch.map(async (attempt) => {
          const concept = conceptMap.get(attempt.concept_id)
          const grade = await gradeAnswer({
            conceptTitle: concept?.title ?? attempt.concept_title,
            conceptExplanation: concept?.explanation ?? '',
            exerciseType: attempt.exercise_type,
            prompt: attempt.exercise_prompt,
            expectedAnswer: attempt.expected_answer,
            userAnswer: attempt.user_answer,
            answerVariants: attempt.answer_variants,
          })
          return { ...attempt, grade }
        }),
      )
      graded.push(...results)
    }

    // Fetch current user_progress (server state) for conflict resolution
    const { data: rawProgress } = await supabase
      .from('user_progress')
      .select('id, concept_id, ease_factor, interval_days, due_date, repetitions, production_mastered, is_hard, user_id')
      .eq('user_id', user.id)
      .in('concept_id', conceptIds)
    const progressMap = new Map(
      ((rawProgress ?? []) as UserProgress[]).map(p => [p.concept_id, p]),
    )

    // Fetch user's timezone for SRS
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
    const timezone = (profileRow as { timezone: string | null } | null)?.timezone ?? null

    // Sort attempts chronologically and apply SRS sequentially per concept
    const sortedGraded = [...graded].sort(
      (a, b) => new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime(),
    )

    let anyMastered = false

    for (const attempt of sortedGraded) {
      const score = attempt.grade.score as SRSScore
      const existing = progressMap.get(attempt.concept_id)
      const progress = existing
        ? { ease_factor: existing.ease_factor, interval_days: existing.interval_days, repetitions: existing.repetitions }
        : DEFAULT_PROGRESS

      const srsResult = sm2(progress, score, timezone)

      // Upsert user_progress
      if (existing) {
        await supabase
          .from('user_progress')
          .update({
            ease_factor: srsResult.ease_factor,
            interval_days: srsResult.interval_days,
            due_date: srsResult.due_date,
            repetitions: srsResult.repetitions,
            last_reviewed_at: attempt.attempted_at,
          })
          .eq('id', existing.id)

        // Update local map for next iteration
        existing.ease_factor = srsResult.ease_factor
        existing.interval_days = srsResult.interval_days
        existing.repetitions = srsResult.repetitions
      } else {
        const { data: inserted } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            concept_id: attempt.concept_id,
            ease_factor: srsResult.ease_factor,
            interval_days: srsResult.interval_days,
            due_date: srsResult.due_date,
            repetitions: srsResult.repetitions,
            last_reviewed_at: attempt.attempted_at,
          })
          .select()
          .single()
        if (inserted) {
          progressMap.set(attempt.concept_id, inserted as UserProgress)
        }
      }

      // Check mastery threshold
      if (srsResult.interval_days >= 21) {
        anyMastered = true
      }
    }

    // Batch insert exercise_attempts
    const attemptRows = sortedGraded.map(a => ({
      user_id: user.id,
      exercise_id: a.exercise_id,
      user_answer: a.user_answer,
      is_correct: a.grade.is_correct,
      ai_score: a.grade.score,
      ai_feedback: a.grade.feedback,
      created_at: a.attempted_at,
    }))
    await supabase.from('exercise_attempts').insert(attemptRows)

    // Update streak + computed level
    await updateStreakIfNeeded(supabase, user.id)
    await updateComputedLevel(supabase, user.id, { justMastered: anyMastered })

    // Create offline report
    const correctCount = sortedGraded.filter(a => a.grade.is_correct).length
    const totalCount = sortedGraded.length
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : null

    const { data: report } = await supabase
      .from('offline_reports')
      .insert({
        user_id: user.id,
        session_id,
        attempt_count: totalCount,
        correct_count: correctCount,
        accuracy,
        reviewed: false,
      })
      .select('id')
      .single()

    const reportId = (report as { id: string } | null)?.id

    // Insert report attempts
    if (reportId) {
      const reportAttempts = sortedGraded.map(a => ({
        report_id: reportId,
        exercise_id: a.exercise_id,
        concept_id: a.concept_id,
        concept_title: a.concept_title,
        exercise_type: a.exercise_type,
        exercise_prompt: a.exercise_prompt,
        user_answer: a.user_answer,
        score: a.grade.score,
        is_correct: a.grade.is_correct,
        feedback: a.grade.feedback,
        corrected_version: a.grade.corrected_version,
        explanation: a.grade.explanation,
        attempted_at: a.attempted_at,
      }))
      await supabase.from('offline_report_attempts').insert(reportAttempts)
    }

    // Send push notification if user has subscription
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_subscription')
        .eq('id', user.id)
        .single()
      const sub = (profile as { push_subscription: unknown } | null)?.push_subscription
      if (sub && typeof sub === 'object') {
        const webpush = await import('web-push')
        webpush.setVapidDetails(
          process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
          process.env.VAPID_PRIVATE_KEY ?? '',
        )
        await webpush.sendNotification(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sub as any,
          JSON.stringify({
            title: '¡Resultados listos!',
            body: `${correctCount}/${totalCount} correctas en tu sesión offline.`,
            url: `/offline/reports/${reportId}`,
          }),
        )
      }
    } catch {
      // Push notification failure is non-critical
    }

    return NextResponse.json({
      report_id: reportId,
      results: sortedGraded.map(a => ({
        exercise_id: a.exercise_id,
        concept_id: a.concept_id,
        score: a.grade.score,
        is_correct: a.grade.is_correct,
        feedback: a.grade.feedback,
        corrected_version: a.grade.corrected_version,
        explanation: a.grade.explanation,
      })),
      summary: {
        total: totalCount,
        correct: correctCount,
        accuracy_pct: accuracy,
      },
    })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[offline/grade-batch] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
