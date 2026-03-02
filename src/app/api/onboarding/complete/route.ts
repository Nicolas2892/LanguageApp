import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DiagnosticResult {
  concept_id: string
  exercise_id: string
  user_answer: string
  score: number
}

// Map score → initial interval_days for SRS seeding
function scoreToInterval(score: number): number {
  if (score >= 3) return 14  // near-mastered
  if (score >= 2) return 6   // known
  if (score >= 1) return 2   // shaky
  return 1                   // unknown — due tomorrow
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { results: DiagnosticResult[] }
    const { results } = body

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'No results provided' }, { status: 400 })
    }

    const now = new Date()

    // 1. Upsert user_progress for each concept based on score
    const progressRows = results.map(({ concept_id, score }) => {
      const intervalDays = scoreToInterval(score)
      const dueDate = new Date(now)
      dueDate.setDate(now.getDate() + intervalDays)

      return {
        user_id: user.id,
        concept_id,
        ease_factor: 2.5,
        interval_days: intervalDays,
        due_date: dueDate.toISOString().split('T')[0],
        repetitions: 1,
        last_reviewed_at: now.toISOString(),
      }
    })

    await supabase
      .from('user_progress')
      .upsert(progressRows, { onConflict: 'user_id,concept_id' })

    // 2. Mark onboarding as complete
    // Note: exercise_attempts already inserted by /api/submit during grading
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[onboarding/complete] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
