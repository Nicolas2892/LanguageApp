import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateOrigin } from '@/lib/api-utils'

const HintSchema = z.object({
  exercise_id: z.string().uuid(),
  concept_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit: 20 requests per 10 minutes per user
    if (!(await checkRateLimit(user.id, 'hint', { maxRequests: 20, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = HintSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { exercise_id, concept_id } = parsed.data

    const [{ data: exercise }, { data: concept }] = await Promise.all([
      supabase.from('exercises').select('id, concept_id, prompt, expected_answer').eq('id', exercise_id).single(),
      supabase.from('concepts').select('id, title, explanation').eq('id', concept_id).single(),
    ])

    if (!exercise || !concept) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ex = exercise as { id: string; concept_id: string; prompt: string; expected_answer: string | null }
    const con = concept as { id: string; title: string; explanation: string }

    // Verify exercise belongs to the requested concept
    if (ex.concept_id !== concept_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 256,
      system: [{ type: 'text', text: 'You are a Spanish B1→B2 tutor. Give a brief worked example that demonstrates the target concept in a different sentence from the exercise. Be concise — one or two sentences max.', cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Concept: ${con.title}\nExercise prompt: ${ex.prompt}\nExpected answer: ${ex.expected_answer ?? '(open-ended)'}\n\nGive a worked example using the same concept but a completely different sentence.`,
      }],
    })

    const hint = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ hint })
  } catch (err) {
    console.error('[hint]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
