import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { started_at, concepts_reviewed, accuracy } = await request.json() as {
      started_at: string
      concepts_reviewed: number
      accuracy: number
    }

    await supabase.from('study_sessions').insert({
      user_id: user.id,
      started_at,
      ended_at: new Date().toISOString(),
      concepts_reviewed,
      accuracy,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sessions/complete]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
