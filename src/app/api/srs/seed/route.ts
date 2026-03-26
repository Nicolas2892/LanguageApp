import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const ItemSchema = z.discriminatedUnion('item_type', [
  z.object({ item_type: z.literal('verb'), verb_id: z.string().uuid(), tense: z.string() }),
  z.object({ item_type: z.literal('vocab'), vocab_id: z.string().uuid() }),
])

const SeedSchema = z.object({
  items: z.array(ItemSchema).min(1).max(100),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limited = await checkRateLimit(user.id, 'srs-seed', { maxRequests: 30, windowMs: 10 * 60 * 1000 })
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = SeedSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    await supabase.rpc('seed_srs_items', {
      p_user_id: user.id,
      p_items: JSON.stringify(parsed.data.items),
    })

    return NextResponse.json({ ok: true, seeded: parsed.data.items.length })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[srs/seed] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
