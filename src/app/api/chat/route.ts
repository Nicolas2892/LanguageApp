import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import { buildTutorSystemPrompt } from '@/lib/claude/tutor'
import { checkRateLimit } from '@/lib/rate-limit'

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

  // Rate limit: 20 requests per 10 minutes per user
  if (!checkRateLimit(user.id, 'chat', { maxRequests: 20, windowMs: 10 * 60 * 1000 }).allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
  }

  const parsed = ChatSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { messages, conceptId } = parsed.data

  // Fetch profile for name + level (explicit columns)
  const { data: profile } = await supabase
    .from('profiles').select('display_name, current_level').eq('id', user.id).single()

  // Early-return guard: profile may be null for brand-new sessions
  const typedProfile = profile as { display_name: string | null; current_level: string } | null

  // Optionally fetch concept context
  let conceptTitle: string | undefined
  let conceptExplanation: string | undefined
  if (conceptId) {
    const { data: concept } = await supabase
      .from('concepts').select('title, explanation').eq('id', conceptId).single()
    const c = concept as { title: string; explanation: string } | null
    if (c) {
      conceptTitle = c.title
      conceptExplanation = c.explanation
    }
  }

  // Fetch up to 5 recent wrong attempt feedbacks
  const { data: recentAttempts } = await supabase
    .from('exercise_attempts')
    .select('ai_feedback')
    .eq('user_id', user.id)
    .eq('is_correct', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentErrors = (recentAttempts ?? [])
    .map((a) => (a as { ai_feedback: string | null }).ai_feedback)
    .filter(Boolean) as string[]

  const systemPrompt = buildTutorSystemPrompt({
    displayName: typedProfile?.display_name ?? 'learner',
    currentLevel: typedProfile?.current_level ?? 'B1',
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
