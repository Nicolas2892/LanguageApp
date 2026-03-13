import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { DEFAULT_PROGRESS } from '@/lib/srs'
import { userLocalToday } from '@/lib/timezone'
import * as Sentry from '@sentry/nextjs'

const HardFlagSchema = z.object({
  is_hard: z.boolean(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 30 req / 10 min
    if (!(await checkRateLimit(user.id, 'concepts-hard', { maxRequests: 30, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = HardFlagSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { id: concept_id } = await params
    const { is_hard } = parsed.data

    // Try update first (row already exists)
    const { data: updated } = await supabase
      .from('user_progress')
      .update({ is_hard })
      .eq('user_id', user.id)
      .eq('concept_id', concept_id)
      .select('is_hard')
      .single()

    if (!updated) {
      // No existing row — insert with SRS defaults (timezone-aware)
      const { data: profileTz } = await supabase.from('profiles').select('timezone').eq('id', user.id).single()
      const today = userLocalToday((profileTz as { timezone: string | null } | null)?.timezone)
      await supabase.from('user_progress').insert({
        user_id: user.id,
        concept_id,
        is_hard,
        ...DEFAULT_PROGRESS,
        due_date: today,
      })
    }

    return NextResponse.json({ is_hard })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[concepts/hard] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
