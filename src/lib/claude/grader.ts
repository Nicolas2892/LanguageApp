import { anthropic, TUTOR_MODEL } from './client'
import type { SRSScore } from '@/lib/srs'

export interface GradeResult {
  score: SRSScore
  is_correct: boolean
  feedback: string
  corrected_version: string
  explanation: string
}

export async function gradeAnswer({
  conceptTitle,
  conceptExplanation,
  exerciseType,
  prompt,
  expectedAnswer,
  userAnswer,
}: {
  conceptTitle: string
  conceptExplanation: string
  exerciseType: string
  prompt: string
  expectedAnswer: string | null
  userAnswer: string
}): Promise<GradeResult> {
  const systemPrompt = `You are a Spanish language tutor grading exercises for a B1→B2 learner.
You are strict but fair. You evaluate correctness, naturalness, and whether the target concept was applied.
Always respond with valid JSON only — no markdown, no extra text.`

  const userPrompt = `Grade this Spanish exercise response.

Concept being tested: ${conceptTitle}
Concept explanation: ${conceptExplanation}
Exercise type: ${exerciseType}
Exercise prompt: ${prompt}
${expectedAnswer ? `Expected answer (or an acceptable variant): ${expectedAnswer}` : 'This is an open-ended exercise — evaluate based on correct use of the concept.'}
Student's answer: ${userAnswer}

Score the response:
- 3: Perfectly correct, natural, and the target concept is used exactly right
- 2: Correct meaning and concept applied, but minor spelling/accent/word-order errors
- 1: Partially correct — concept attempted but with significant errors or unnatural phrasing
- 0: Wrong — concept not applied, major grammatical error, or nonsensical answer

Respond with this exact JSON structure:
{
  "score": <0|1|2|3>,
  "is_correct": <true if score >= 2>,
  "feedback": "<one sentence of direct feedback to the student in English>",
  "corrected_version": "<the correct Spanish answer>",
  "explanation": "<1-2 sentences explaining why, referencing the grammar rule>"
}`

  const message = await anthropic.messages.create({
    model: TUTOR_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(text) as GradeResult
    // Clamp score to valid range
    parsed.score = Math.max(0, Math.min(3, parsed.score)) as SRSScore
    parsed.is_correct = parsed.score >= 2
    return parsed
  } catch {
    // Fallback if JSON parsing fails
    return {
      score: 0,
      is_correct: false,
      feedback: 'Could not parse AI response. Please try again.',
      corrected_version: expectedAnswer ?? '',
      explanation: '',
    }
  }
}
