import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/api-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

const FavoriteSchema = z.object({
  verb_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limited = await checkRateLimit(user.id, 'verbs-favorite', { maxRequests: 30, windowMs: 10 * 60 * 1000 })
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = FavoriteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { verb_id } = parsed.data

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_verb_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('verb_id', verb_id)
      .single()

    if (existing) {
      // Remove favorite
      await supabase
        .from('user_verb_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('verb_id', verb_id)
      return NextResponse.json({ favorited: false })
    } else {
      // Add favorite
      await supabase
        .from('user_verb_favorites')
        .insert({ user_id: user.id, verb_id })
      return NextResponse.json({ favorited: true })
    }
  } catch (err) {
    Sentry.captureException(err)
    console.error('[verbs/favorite] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
