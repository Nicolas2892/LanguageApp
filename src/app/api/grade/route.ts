import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, UserProgress } from '@/lib/supabase/types'

const GradeSchema = z.object({
  concept_id: z.string().uuid(),
  ai_prompt: z.string().min(1).max(2000),
  user_answer: z.string().min(1).max(2000),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = GradeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { concept_id, ai_prompt, user_answer } = parsed.data

    // 1. Fetch concept
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
      exerciseType: 'free_write',
      prompt: ai_prompt,
      expectedAnswer: null,
      userAnswer: user_answer,
    })

    // 3. Fetch current user_progress (or use defaults)
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
      next_review_in_days: newSRS.interval_days,
    })
  } catch (err) {
    console.error('[grade] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
