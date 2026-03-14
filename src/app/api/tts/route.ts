import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createHash } from 'crypto'

const bodySchema = z.object({
  text: z.string().min(1).max(2000),
})

// Server-side cache: SHA-256 of text → audio buffer
const audioCache = new Map<string, Buffer>()

/** Clear the audio cache (for tests). */
export function clearAudioCache(): void {
  audioCache.clear()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 30 requests per 10 minutes per user
    if (!(await checkRateLimit(user.id, 'tts', { maxRequests: 30, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { text } = parsed.data
    const cacheKey = createHash('sha256').update(text).digest('hex')

    // Return cached audio if available
    const cached = audioCache.get(cacheKey)
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      response_format: 'mp3',
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Cache for future requests (same text across users)
    audioCache.set(cacheKey, buffer)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[tts]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
