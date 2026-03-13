import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
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

    // Rate limit: 20 requests per 10 minutes per user
    if (!(await checkRateLimit(user.id, 'transcribe', { maxRequests: 20, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const formData = await request.formData()
    const audio = formData.get('audio')

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio field' }, { status: 400 })
    }

    if (audio.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 5MB)' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
      language: 'es',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[transcribe]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
