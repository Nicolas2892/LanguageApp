import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeAnswer } from '@/lib/claude/grader'
import { sm2, DEFAULT_PROGRESS } from '@/lib/srs'
import type { SRSScore } from '@/lib/srs'
import type { Concept, UserProgress } from '@/lib/supabase/types'
import { computeLevel } from '@/lib/mastery/computeLevel'

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

    const parsed = GradeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { concept_ids, ai_prompt, user_answer } = parsed.data

    // 1. Fetch all concepts
    const { data: concepts, error: conceptErr } = await supabase
      .from('concepts')
      .select('*')
      .in('id', concept_ids)

    if (conceptErr || !concepts || concepts.length === 0) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }
    const typedConcepts = concepts as Concept[]

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

    // 3. Upsert user_progress for each concept with the same holistic score
    for (const concept_id of concept_ids) {
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

    // Recompute and persist the user's CEFR level after all upserts
    const { data: levelRows } = await supabase
      .from('concepts')
      .select('level, user_progress!inner(production_mastered, interval_days)')
      .eq('user_progress.user_id', user.id)

    type LevelRow = { level: string; user_progress: { production_mastered: boolean; interval_days: number }[] }
    const totalByLevel: Record<string, number> = {}
    const masteredByLevel: Record<string, number> = {}
    for (const row of ((levelRows ?? []) as LevelRow[])) {
      totalByLevel[row.level] = (totalByLevel[row.level] ?? 0) + 1
      const progress = row.user_progress[0]
      if (progress?.interval_days >= 21 && progress?.production_mastered) {
        masteredByLevel[row.level] = (masteredByLevel[row.level] ?? 0) + 1
      }
    }
    const newComputedLevel = computeLevel(masteredByLevel, totalByLevel)
    await supabase
      .from('profiles')
      .update({ computed_level: newComputedLevel })
      .eq('id', user.id)

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
      next_review_in_days: nextReviewDays,
    })
  } catch (err) {
    console.error('[grade] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
