import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assessPronunciation } from '@/lib/azure/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'
import * as Sentry from '@sentry/nextjs'

const MAX_AUDIO_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 30 requests per 10 minutes per user
    if (!(await checkRateLimit(user.id, 'pronunciation-assess', { maxRequests: 30, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const formData = await request.formData()
    const audio = formData.get('audio')
    const text = formData.get('text')

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio field' }, { status: 400 })
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
    }

    if (!audio.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Only audio files are allowed' }, { status: 400 })
    }

    if (audio.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 5MB)' }, { status: 400 })
    }

    // Fetch user's target accent preference
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('target_accent')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      console.error('[pronunciation/assess] profile fetch error:', profileErr)
    }

    const targetAccent = (profile as { target_accent: string | null } | null)?.target_accent ?? 'castilian'

    const audioBuffer = Buffer.from(await audio.arrayBuffer())
    const result = await assessPronunciation(audioBuffer, text.trim(), targetAccent)

    return NextResponse.json(result)
  } catch (err) {
    Sentry.captureException(err)
    console.error('[pronunciation/assess]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
