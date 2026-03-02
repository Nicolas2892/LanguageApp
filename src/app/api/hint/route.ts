import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import type { Concept, Exercise } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { exercise_id, concept_id } = await request.json() as {
      exercise_id: string
      concept_id: string
    }

    const [{ data: exercise }, { data: concept }] = await Promise.all([
      supabase.from('exercises').select('*').eq('id', exercise_id).single(),
      supabase.from('concepts').select('*').eq('id', concept_id).single(),
    ])

    if (!exercise || !concept) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ex = exercise as Exercise
    const con = concept as Concept

    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 256,
      system: 'You are a Spanish B1→B2 tutor. Give a brief worked example that demonstrates the target concept in a different sentence from the exercise. Be concise — one or two sentences max.',
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
