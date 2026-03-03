import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, Exercise, UserProgress } from '@/lib/supabase/types'

const SubmitSchema = z.object({
  exercise_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  user_answer: z.string().min(1).max(2000),
  skip_srs: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = SubmitSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { exercise_id, concept_id, user_answer, skip_srs } = parsed.data

    // 1. Fetch exercise + concept
    const { data: exercise, error: exErr } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exercise_id)
      .single()

    if (exErr || !exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }
    const typedExercise = exercise as Exercise

    const { data: concept, error: conceptErr } = await supabase
      .from('concepts')
      .select('*')
      .eq('id', concept_id)
      .single()

    if (conceptErr || !concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }
    const typedConcept = concept as Concept

    // 2. Grade with Claude
    const gradeResult = await gradeAnswer({
      conceptTitle: typedConcept.title,
      conceptExplanation: typedConcept.explanation,
      exerciseType: typedExercise.type,
      prompt: typedExercise.prompt,
      expectedAnswer: typedExercise.expected_answer,
      userAnswer: user_answer,
    })

    let nextReviewInDays = 0

    if (!skip_srs) {
      // 3. Fetch current user_progress (or use defaults if first time)
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('concept_id', concept_id)
        .single()

      const currentProgress = existingProgress ?? {
        ...DEFAULT_PROGRESS,
        user_id: user.id,
        concept_id,
      }

      // 4. Calculate new SRS values
      const newSRS = sm2(currentProgress as Pick<UserProgress, 'ease_factor' | 'interval_days' | 'repetitions'>, gradeResult.score as SRSScore)
      nextReviewInDays = newSRS.interval_days

      // 5. Upsert user_progress
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

    // 6. Record the attempt
    await supabase
      .from('exercise_attempts')
      .insert({
        user_id: user.id,
        exercise_id,
        user_answer,
        is_correct: gradeResult.is_correct,
        ai_score: gradeResult.score,
        ai_feedback: gradeResult.feedback,
      })

    // 7. Update streak — once per day on first submit
    const todayDate = new Date().toISOString().split('T')[0]
    const { data: profileData } = await supabase
      .from('profiles')
      .select('streak, last_studied_date')
      .eq('id', user.id)
      .single()
    const p = profileData as { streak: number; last_studied_date: string | null } | null
    if (p && p.last_studied_date !== todayDate) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const newStreak = p.last_studied_date === yesterday.toISOString().split('T')[0]
        ? p.streak + 1
        : 1
      await supabase
        .from('profiles')
        .update({ streak: newStreak, last_studied_date: todayDate })
        .eq('id', user.id)
    }

    return NextResponse.json({
      ...gradeResult,
      next_review_in_days: nextReviewInDays,
    })
  } catch (err) {
    console.error('[submit] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
