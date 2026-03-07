import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import type { Concept } from '@/lib/supabase/types'
import { checkRateLimit } from '@/lib/rate-limit'

const TopicSchema = z.object({
  concept_ids: z.array(z.string().uuid()).min(1).max(5),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 10 requests per 10 minutes per user
    if (!(await checkRateLimit(user.id, 'topic', { maxRequests: 10, windowMs: 10 * 60 * 1000 })).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
    }

    const parsed = TopicSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { concept_ids } = parsed.data

    const { data: concepts, error: conceptErr } = await supabase
      .from('concepts')
      .select('id, title, explanation')
      .in('id', concept_ids)

    if (conceptErr || !concepts || concepts.length === 0) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }
    const typedConcepts = concepts as Pick<Concept, 'id' | 'title' | 'explanation'>[]

    const conceptList = typedConcepts
      .map((c) => `- ${c.title}: ${c.explanation}`)
      .join('\n')

    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 256,
      system: `You are a creative Spanish writing coach for B1→B2 learners. Generate short, engaging writing prompts that require the student to actively use specific grammar concepts. Keep prompts concrete and relatable to daily life. The student should aim for 150–200 words. Respond with only the prompt text — no labels, no preamble, no quotes.`,
      messages: [{
        role: 'user',
        content: `Grammar concept(s) to practice:\n${conceptList}\n\nWrite a single relatable writing prompt (a realistic scenario: personal opinion, letter, or short narrative) that requires the student to use these concepts naturally in 150–200 words. Do not mention the grammar rules explicitly in the prompt.`,
      }],
    })

    const topic = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return NextResponse.json({ topic })
  } catch (err) {
    console.error('[topic] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
