import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { PRONUNCIATION_CATEGORIES } from '@/lib/pronunciation/l1-maps'
import * as Sentry from '@sentry/nextjs'

const ProgressSchema = z.object({
  category: z.enum(PRONUNCIATION_CATEGORIES),
  correct:  z.boolean(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limited = await checkRateLimit(user.id, 'pronunciation-progress', { maxRequests: 120, windowMs: 10 * 60 * 1000 })
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = ProgressSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { category, correct } = parsed.data

    await supabase.rpc('increment_pronunciation_progress', {
      p_user_id:  user.id,
      p_category: category,
      p_correct:  correct,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[pronunciation/progress] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
