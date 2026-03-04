import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { anthropic, TUTOR_MODEL } from '@/lib/claude/client'
import type { Concept, Exercise, AnnotationSpan } from '@/lib/supabase/types'

function createServiceRoleClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const GenerateSchema = z.object({
  concept_id: z.string().uuid(),
  type: z.enum(['gap_fill', 'translation', 'transformation', 'error_correction']),
})

const TYPE_RULES: Record<string, string> = {
  gap_fill:         'Write 2–3 connected Spanish sentences forming a short coherent paragraph. Include exactly 2 or 3 blanks (___). One blank must require the specific target concept; the remaining blank(s) require related connectors or structures the learner must independently recall. "expected_answer" MUST be a JSON-encoded array string with one entry per blank in left-to-right order, e.g. "[\"sin embargo\",\"aunque\"]". Do NOT hint at the answer within the sentence.',
  translation:      'an English sentence to translate into Spanish',
  transformation:   'a Spanish sentence pair to combine using the target structure',
  error_correction: 'quote a Spanish sentence containing a deliberate error in "double quotes"',
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = GenerateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { concept_id, type } = parsed.data

    // Fetch concept
    const { data: conceptData } = await supabase
      .from('concepts')
      .select('*')
      .eq('id', concept_id)
      .single()

    if (!conceptData) return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    const concept = conceptData as Concept

    const typeLabel = type.replace(/_/g, ' ')
    const rule = TYPE_RULES[type]

    const promptText = `You are a Spanish language exercise author for B1→B2 learners.
Generate ONE new ${typeLabel} exercise for the concept "${concept.title}".
Concept explanation: ${concept.explanation}
Examples: ${JSON.stringify(concept.examples)}

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "prompt": "...",
  "expected_answer": "...",
  "hint_1": "...",
  "hint_2": "...",
  "annotations": [{ "text": "...", "form": null }]
}

For "annotations", split the prompt text into spans covering every character. Use form: "subjunctive" for conjugated present/imperfect subjunctive verb forms, form: "indicative" for indicative forms (sparingly), form: null for everything else (nouns, conjunctions, blanks, punctuation). The concatenation of all span texts must equal the prompt exactly.

Rules for ${typeLabel}: ${rule}`

    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: promptText }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

    let generated: { prompt: string; expected_answer: string; hint_1: string; hint_2: string; annotations?: AnnotationSpan[] }
    try {
      generated = JSON.parse(raw)
    } catch {
      console.error('[generate] JSON parse failed:', raw)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    if (!generated.prompt || !generated.expected_answer) {
      return NextResponse.json({ error: 'Invalid AI response structure' }, { status: 500 })
    }

    // For gap_fill, validate expected_answer is a JSON array
    if (type === 'gap_fill') {
      try {
        const parsed = JSON.parse(generated.expected_answer)
        if (!Array.isArray(parsed)) throw new Error('not array')
      } catch {
        return NextResponse.json({ error: 'AI returned invalid gap_fill answer format' }, { status: 500 })
      }
    }

    // Validate annotations: concatenated spans must equal prompt
    let validatedAnnotations: AnnotationSpan[] | null = null
    if (Array.isArray(generated.annotations) && generated.annotations.length > 0) {
      const concatenated = generated.annotations.map((s) => s.text).join('')
      if (concatenated === generated.prompt) {
        validatedAnnotations = generated.annotations
      } else {
        console.warn('[generate] annotations span mismatch — storing null')
      }
    }

    // Insert into exercises table using service role to bypass RLS
    const serviceClient = createServiceRoleClient()
    const { data: newExercise, error: insertErr } = await serviceClient
      .from('exercises')
      .insert({
        concept_id,
        type,
        prompt: generated.prompt,
        expected_answer: generated.expected_answer,
        hint_1: generated.hint_1 ?? null,
        hint_2: generated.hint_2 ?? null,
        annotations: validatedAnnotations,
      })
      .select('*')
      .single()

    if (insertErr || !newExercise) {
      console.error('[generate] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to save exercise' }, { status: 500 })
    }

    return NextResponse.json(newExercise as Exercise)
  } catch (err) {
    console.error('[generate] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
