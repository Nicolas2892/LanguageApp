import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { TENSES } from '@/lib/verbs/constants'
import * as Sentry from '@sentry/nextjs'

const GradeSchema = z.object({
  verb_id:    z.string().uuid(),
  tense:      z.enum(TENSES),
  is_correct: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limited = await checkRateLimit(user.id, 'verbs-grade', { maxRequests: 120, windowMs: 10 * 60 * 1000 })
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = GradeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { verb_id, tense, is_correct } = parsed.data

    await supabase.rpc('increment_verb_progress', {
      p_user_id:  user.id,
      p_verb_id:  verb_id,
      p_tense:    tense,
      p_correct:  is_correct,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[verbs/grade] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
