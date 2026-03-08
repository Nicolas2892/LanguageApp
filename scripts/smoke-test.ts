/**
 * Post-deploy smoke test: verifies RPC, Haiku grading, and hint generation
 * using real data from the DB.
 */
import { createClient } from '@supabase/supabase-js'
import { gradeAnswer } from '../src/lib/claude/grader'
import { anthropic, GRADE_MODEL } from '../src/lib/claude/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY || !process.env.ANTHROPIC_API_KEY) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

let passed = 0
let failed = 0

function ok(label: string, detail = '') {
  console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`)
  passed++
}

function fail(label: string, detail = '') {
  console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
  failed++
}

async function testRPC() {
  console.log('\n[PERF-03] SQL RPC: get_subscribers_with_due_counts')
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.rpc('get_subscribers_with_due_counts', {
    p_today: today,
    p_limit: 10,
    p_offset: 0,
  })
  if (error) {
    fail('RPC exists and is callable', error.message)
  } else {
    ok('RPC exists and is callable', `returned ${(data as unknown[]).length} subscriber(s)`)
    // Validate shape of returned rows
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0] as Record<string, unknown>
      const hasExpectedFields = 'id' in row && 'streak' in row && 'due_count' in row
      hasExpectedFields ? ok('RPC row shape correct (id, streak, due_count)') : fail('RPC row missing expected fields', JSON.stringify(Object.keys(row)))
    } else {
      ok('RPC callable with 0 subscribers (no push subscribers in DB)')
    }
  }
}

async function testGrading() {
  console.log('\n[ARCH-02] Haiku grading via gradeAnswer()')

  // Fetch a translation exercise (expected_answer is always a plain string, safe to echo back)
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, type, prompt, expected_answer, concept_id')
    .eq('type', 'translation')
    .not('expected_answer', 'is', null)
    .limit(1)

  if (!exercises?.[0]) {
    fail('Could not fetch translation exercise from DB')
    return
  }

  const ex = exercises[0] as { type: string; prompt: string; expected_answer: string; concept_id: string }

  // Fetch the matching concept
  const { data: conceptData } = await supabase
    .from('concepts')
    .select('id, title, explanation')
    .eq('id', ex.concept_id)
    .single()

  if (!conceptData) {
    fail('Could not fetch concept for exercise')
    return
  }

  const con = conceptData as { title: string; explanation: string }

  // Test 1: correct answer (echo back the expected answer)
  const correctResult = await gradeAnswer({
    conceptTitle: con.title,
    conceptExplanation: con.explanation,
    exerciseType: ex.type,
    prompt: ex.prompt,
    expectedAnswer: ex.expected_answer,
    userAnswer: ex.expected_answer,
  })

  if (correctResult.feedback === 'Could not parse AI response. Please try again.') {
    fail('Haiku returned unparseable JSON on correct answer')
  } else if (correctResult.score >= 2) {
    ok('Correct answer scores ≥2', `score=${correctResult.score}, feedback="${correctResult.feedback.slice(0, 60)}..."`)
  } else {
    fail('Correct answer scored unexpectedly low', `score=${correctResult.score}`)
  }

  // Test 2: nonsense answer
  const wrongResult = await gradeAnswer({
    conceptTitle: con.title,
    conceptExplanation: con.explanation,
    exerciseType: ex.type,
    prompt: ex.prompt,
    expectedAnswer: ex.expected_answer,
    userAnswer: 'xyzzy gibberish nonsense 123',
  })

  if (wrongResult.feedback === 'Could not parse AI response. Please try again.') {
    fail('Haiku returned unparseable JSON on wrong answer')
  } else if (wrongResult.score <= 1) {
    ok('Wrong answer scores ≤1', `score=${wrongResult.score}`)
  } else {
    fail('Wrong answer scored unexpectedly high', `score=${wrongResult.score}`)
  }
}

async function testHint() {
  console.log('\n[ARCH-02] Haiku hint generation')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, concept_id, prompt, expected_answer')
    .limit(1)

  if (!exercises?.[0]) {
    fail('Could not fetch exercise for hint test')
    return
  }

  const ex = exercises[0] as { concept_id: string; prompt: string; expected_answer: string | null }

  const { data: conceptData } = await supabase
    .from('concepts')
    .select('id, title, explanation')
    .eq('id', ex.concept_id)
    .single()

  if (!conceptData) {
    fail('Could not fetch concept for hint test')
    return
  }

  const con = conceptData as { title: string; explanation: string }

  try {
    const message = await anthropic.messages.create({
      model: GRADE_MODEL,
      max_tokens: 256,
      system: [{ type: 'text', text: 'You are a Spanish B1→B2 tutor. Give a brief worked example that demonstrates the target concept in a different sentence from the exercise. Be concise — one or two sentences max.', cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Concept: ${con.title}\nExercise prompt: ${ex.prompt}\nExpected answer: ${ex.expected_answer ?? '(open-ended)'}\n\nGive a worked example using the same concept but a completely different sentence.`,
      }],
    })
    const hint = message.content[0].type === 'text' ? message.content[0].text : ''
    if (hint.length > 10) {
      ok('Hint generated successfully', `"${hint.slice(0, 80)}..."`)
    } else {
      fail('Hint response too short or empty', hint)
    }
  } catch (err) {
    fail('Hint API call threw', err instanceof Error ? err.message : String(err))
  }
}

async function main() {
  console.log('Post-deploy smoke test')
  console.log('======================')

  await testRPC()
  await testGrading()
  await testHint()

  console.log(`\n======================`)
  console.log(`Results: ${passed} passed, ${failed} failed`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
