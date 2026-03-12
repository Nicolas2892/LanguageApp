import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import { buildTutorSystemPrompt } from '@/lib/claude/tutor'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'

export const runtime = 'nodejs'

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8000),
  })).min(1).max(50),
  conceptId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit: 20 requests per 10 minutes per user
  if (!(await checkRateLimit(user.id, 'chat', { maxRequests: 20, windowMs: 10 * 60 * 1000 })).allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
  }

  const parsed = ChatSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { messages, conceptId } = parsed.data

  // Fetch profile, concept context, and recent errors in parallel
  const [{ data: profile }, conceptResult, { data: recentAttempts }] = await Promise.all([
    supabase.from('profiles').select('display_name, computed_level').eq('id', user.id).single(),
    conceptId
      ? supabase.from('concepts').select('title, explanation').eq('id', conceptId).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('exercise_attempts')
      .select('ai_feedback')
      .eq('user_id', user.id)
      .eq('is_correct', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const typedProfile = profile as { display_name: string | null; computed_level: string } | null

  const conceptData = conceptResult.data as { title: string; explanation: string } | null
  const conceptTitle = conceptData?.title
  const conceptExplanation = conceptData?.explanation

  const recentErrors = (recentAttempts ?? [])
    .map((a) => (a as { ai_feedback: string | null }).ai_feedback)
    .filter(Boolean) as string[]

  const systemPrompt = buildTutorSystemPrompt({
    displayName: typedProfile?.display_name ?? 'learner',
    currentLevel: typedProfile?.computed_level ?? 'B1',
    conceptTitle,
    conceptExplanation,
    recentErrors,
  })

  // Stream the response
  const stream = await anthropic.messages.stream({
    model: TUTOR_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        console.error('[chat] stream error:', err)
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
