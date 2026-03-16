import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const VerbAttemptSchema = z.object({
  verb_id: z.string().uuid(),
  tense: z.string().min(1),
  correct: z.boolean(),
  attempted_at: z.string(),
})

const SyncSchema = z.object({
  attempts: z.array(VerbAttemptSchema).min(1).max(200),
})

/**
 * POST /api/offline/verb-sync
 *
 * Syncs queued verb conjugation attempts via the increment_verb_progress RPC.
 * No Claude needed — verb grading was done locally.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rl = await checkRateLimit(user.id, 'offline-verb-sync', {
      maxRequests: 10,
      windowMs: 10 * 60 * 1000,
    })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const parsed = SyncSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { attempts } = parsed.data
    let synced = 0

    for (const attempt of attempts) {
      const { error } = await supabase.rpc('increment_verb_progress', {
        p_user_id: user.id,
        p_verb_id: attempt.verb_id,
        p_tense: attempt.tense,
        p_correct: attempt.correct,
      })
      if (!error) synced++
    }

    return NextResponse.json({ synced, total: attempts.length })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[offline/verb-sync] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
