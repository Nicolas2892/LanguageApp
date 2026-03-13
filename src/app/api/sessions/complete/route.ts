import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import * as Sentry from '@sentry/nextjs'

const SessionCompleteSchema = z.object({
  started_at: z.string().datetime(),
  concepts_reviewed: z.number().int().min(0).max(500),
  accuracy: z.number().int().min(0).max(100),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = SessionCompleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { started_at, concepts_reviewed, accuracy } = parsed.data

    await supabase.from('study_sessions').insert({
      user_id: user.id,
      started_at,
      ended_at: new Date().toISOString(),
      concepts_reviewed,
      accuracy,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[sessions/complete]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
