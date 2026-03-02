import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import type { Concept } from '@/lib/supabase/types'

const TopicSchema = z.object({
  concept_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = TopicSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { concept_id } = parsed.data

    const { data: concept, error: conceptErr } = await supabase
      .from('concepts')
      .select('*')
      .eq('id', concept_id)
      .single()

    if (conceptErr || !concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }
    const typedConcept = concept as Concept

    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 256,
      system: `You are a creative Spanish writing coach for B1→B2 learners. Generate short, engaging writing prompts that require the student to actively use a specific grammar concept. Keep prompts concrete and relatable to daily life. Respond with only the prompt text — no labels, no preamble, no quotes.`,
      messages: [{
        role: 'user',
        content: `Concept: ${typedConcept.title}
Explanation: ${typedConcept.explanation}

Write a single relatable writing prompt (3–5 sentences achievable) that requires the student to use this concept naturally. Do not mention the grammar rule explicitly in the prompt.`,
      }],
    })

    const topic = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return NextResponse.json({
      topic,
      concept_id: typedConcept.id,
      concept_title: typedConcept.title,
      concept_explanation: typedConcept.explanation,
    })
  } catch (err) {
    console.error('[topic] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
