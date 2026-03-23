import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import * as Sentry from '@sentry/nextjs'

const AttemptSchema = z.object({
  vocab_id: z.string().uuid(),
  correct:  z.boolean(),
})

const SyncSchema = z.object({
  attempts: z.array(AttemptSchema).max(100),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = SyncSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { attempts } = parsed.data
    let synced = 0

    for (const attempt of attempts) {
      const { error } = await supabase.rpc('increment_vocab_progress', {
        p_user_id:  user.id,
        p_vocab_id: attempt.vocab_id,
        p_correct:  attempt.correct,
      })

      if (error) {
        console.error('[offline/vocab-sync] RPC error:', error)
        continue
      }
      synced++
    }

    return NextResponse.json({ synced, total: attempts.length })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[offline/vocab-sync] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
