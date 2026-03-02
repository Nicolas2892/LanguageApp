import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import { buildTutorSystemPrompt } from '@/lib/claude/tutor'
import type { Profile } from '@/lib/supabase/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, conceptId } = await request.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    conceptId?: string
  }

  // Fetch profile for name + level
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  const typedProfile = profile as Profile | null

  // Optionally fetch concept context
  let conceptTitle: string | undefined
  let conceptExplanation: string | undefined
  if (conceptId) {
    const { data: concept } = await supabase
      .from('concepts').select('title, explanation').eq('id', conceptId).single()
    const c = concept as { title: string; explanation: string } | null
    conceptTitle = c?.title
    conceptExplanation = c?.explanation
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
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
