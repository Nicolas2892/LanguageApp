import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, Exercise, UserProgress } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      exercise_id: string
      concept_id: string
      user_answer: string
    }
    const { exercise_id, concept_id, user_answer } = body

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

    return NextResponse.json({
      ...gradeResult,
      next_review_in_days: newSRS.interval_days,
    })
  } catch (err) {
    console.error('[submit] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
