import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin, updateStreakIfNeeded } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { sm2 } from '@/lib/srs'
import { verbOutcomeToSRS, vocabOutcomeToSRS } from '@/lib/srs/scoreMapping'
import { TENSES } from '@/lib/verbs/constants'
import * as Sentry from '@sentry/nextjs'
import type { SRSItem } from '@/lib/supabase/types'

const OUTCOME = z.enum(['correct', 'accent_error', 'incorrect'])

const VerbSchema = z.object({
  item_type: z.literal('verb'),
  verb_id: z.string().uuid(),
  tense: z.enum(TENSES),
  outcome: OUTCOME,
})

const VocabSchema = z.object({
  item_type: z.literal('vocab'),
  vocab_id: z.string().uuid(),
  outcome: OUTCOME,
})

const GradeSchema = z.discriminatedUnion('item_type', [VerbSchema, VocabSchema])

const DEFAULT_PROGRESS = { ease_factor: 2.5, interval_days: 1, repetitions: 0 }

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limited = await checkRateLimit(user.id, 'srs-grade', { maxRequests: 120, windowMs: 10 * 60 * 1000 })
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = GradeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const input = parsed.data

    // Fetch existing SRS state (if any)
    let currentProgress = DEFAULT_PROGRESS
    if (input.item_type === 'verb') {
      const { data } = await supabase
        .from('srs_items')
        .select('ease_factor, interval_days, repetitions')
        .eq('user_id', user.id)
        .eq('verb_id', input.verb_id)
        .eq('tense', input.tense)
        .maybeSingle()
      if (data) currentProgress = data as Pick<SRSItem, 'ease_factor' | 'interval_days' | 'repetitions'>
    } else {
      const { data } = await supabase
        .from('srs_items')
        .select('ease_factor, interval_days, repetitions')
        .eq('user_id', user.id)
        .eq('vocab_id', input.vocab_id)
        .maybeSingle()
      if (data) currentProgress = data as Pick<SRSItem, 'ease_factor' | 'interval_days' | 'repetitions'>
    }

    // Fetch user timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
    const timezone = (profile as { timezone: string | null } | null)?.timezone ?? null

    // Compute SRS score and run SM-2
    const score = input.item_type === 'verb'
      ? verbOutcomeToSRS(input.outcome)
      : vocabOutcomeToSRS(input.outcome)

    const srsResult = sm2(currentProgress, score, timezone)

    // Upsert SRS state + update accuracy counters
    if (input.item_type === 'verb') {
      const [{ error: srsErr }, { error: progErr }] = await Promise.all([
        supabase.rpc('upsert_verb_srs', {
          p_user_id: user.id,
          p_verb_id: input.verb_id,
          p_tense: input.tense,
          p_ease_factor: srsResult.ease_factor,
          p_interval_days: srsResult.interval_days,
          p_due_date: srsResult.due_date,
          p_repetitions: srsResult.repetitions,
        }),
        supabase.rpc('increment_verb_progress', {
          p_user_id: user.id,
          p_verb_id: input.verb_id,
          p_tense: input.tense,
          p_correct: input.outcome !== 'incorrect',
        }),
      ])
      const rpcError = srsErr || progErr
      if (rpcError) {
        Sentry.captureException(rpcError, { tags: { route: 'srs/grade', item_type: 'verb' } })
        console.error('[srs/grade] verb rpc error:', rpcError)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }
    } else {
      const [{ error: srsErr }, { error: progErr }] = await Promise.all([
        supabase.rpc('upsert_vocab_srs', {
          p_user_id: user.id,
          p_vocab_id: input.vocab_id,
          p_ease_factor: srsResult.ease_factor,
          p_interval_days: srsResult.interval_days,
          p_due_date: srsResult.due_date,
          p_repetitions: srsResult.repetitions,
        }),
        supabase.rpc('increment_vocab_progress', {
          p_user_id: user.id,
          p_vocab_id: input.vocab_id,
          p_correct: input.outcome !== 'incorrect',
        }),
      ])
      const rpcError = srsErr || progErr
      if (rpcError) {
        Sentry.captureException(rpcError, { tags: { route: 'srs/grade', item_type: 'vocab' } })
        console.error('[srs/grade] vocab rpc error:', rpcError)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }
    }

    // Streak update (any SRS submission counts)
    await updateStreakIfNeeded(supabase, user.id)

    return NextResponse.json({
      ok: true,
      interval_days: srsResult.interval_days,
      due_date: srsResult.due_date,
      ease_factor: srsResult.ease_factor,
    })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[srs/grade] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
