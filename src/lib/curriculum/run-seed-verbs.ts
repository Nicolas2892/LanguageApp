/**
 * pnpm seed:verbs
 *
 * 1. Inserts 50 high-frequency verbs into the `verbs` table.
 * 2. For each verb × tense (50 × 7 = 350 combos), calls Claude Haiku to
 *    generate 3 in-sentence examples with different pronouns.
 * 3. Writes results incrementally to docs/verb-sentences-YYYY-MM-DD.json.
 * 4. Resume-safe: skips combos already in the output file.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm seed:verbs
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '../supabase/types'
import { TENSES, TENSE_LABELS } from '../verbs/constants'

// ── Environment ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Verb data ─────────────────────────────────────────────────────────────────

type VerbData = {
  infinitive: string
  english: string
  frequency_rank: number
  verb_group: 'ar' | 'er' | 'ir' | 'irregular'
}

const VERB_DATA: VerbData[] = [
  { infinitive: 'ser',       english: 'to be (permanent)',   frequency_rank: 1,  verb_group: 'irregular' },
  { infinitive: 'estar',     english: 'to be (temporary)',   frequency_rank: 2,  verb_group: 'irregular' },
  { infinitive: 'haber',     english: 'to have (auxiliary)', frequency_rank: 3,  verb_group: 'irregular' },
  { infinitive: 'tener',     english: 'to have',             frequency_rank: 4,  verb_group: 'irregular' },
  { infinitive: 'hacer',     english: 'to do / make',        frequency_rank: 5,  verb_group: 'irregular' },
  { infinitive: 'poder',     english: 'to be able to',       frequency_rank: 6,  verb_group: 'irregular' },
  { infinitive: 'decir',     english: 'to say / tell',       frequency_rank: 7,  verb_group: 'irregular' },
  { infinitive: 'ir',        english: 'to go',               frequency_rank: 8,  verb_group: 'irregular' },
  { infinitive: 'ver',       english: 'to see',              frequency_rank: 9,  verb_group: 'irregular' },
  { infinitive: 'dar',       english: 'to give',             frequency_rank: 10, verb_group: 'irregular' },
  { infinitive: 'saber',     english: 'to know (facts)',     frequency_rank: 11, verb_group: 'irregular' },
  { infinitive: 'querer',    english: 'to want / love',      frequency_rank: 12, verb_group: 'irregular' },
  { infinitive: 'llegar',    english: 'to arrive',           frequency_rank: 13, verb_group: 'ar' },
  { infinitive: 'pasar',     english: 'to pass / happen',    frequency_rank: 14, verb_group: 'ar' },
  { infinitive: 'deber',     english: 'to owe / must',       frequency_rank: 15, verb_group: 'er' },
  { infinitive: 'poner',     english: 'to put / place',      frequency_rank: 16, verb_group: 'irregular' },
  { infinitive: 'parecer',   english: 'to seem / appear',    frequency_rank: 17, verb_group: 'er' },
  { infinitive: 'quedar',    english: 'to stay / remain',    frequency_rank: 18, verb_group: 'ar' },
  { infinitive: 'creer',     english: 'to believe / think',  frequency_rank: 19, verb_group: 'er' },
  { infinitive: 'hablar',    english: 'to speak / talk',     frequency_rank: 20, verb_group: 'ar' },
  { infinitive: 'llevar',    english: 'to carry / wear',     frequency_rank: 21, verb_group: 'ar' },
  { infinitive: 'dejar',     english: 'to leave / let',      frequency_rank: 22, verb_group: 'ar' },
  { infinitive: 'seguir',    english: 'to follow / continue',frequency_rank: 23, verb_group: 'irregular' },
  { infinitive: 'encontrar', english: 'to find / meet',      frequency_rank: 24, verb_group: 'ar' },
  { infinitive: 'llamar',    english: 'to call / name',      frequency_rank: 25, verb_group: 'ar' },
  { infinitive: 'venir',     english: 'to come',             frequency_rank: 26, verb_group: 'irregular' },
  { infinitive: 'pensar',    english: 'to think',            frequency_rank: 27, verb_group: 'ar' },
  { infinitive: 'salir',     english: 'to go out / leave',   frequency_rank: 28, verb_group: 'irregular' },
  { infinitive: 'volver',    english: 'to return / come back',frequency_rank: 29, verb_group: 'er' },
  { infinitive: 'tomar',     english: 'to take / drink',     frequency_rank: 30, verb_group: 'ar' },
  { infinitive: 'conocer',   english: 'to know (people)',    frequency_rank: 31, verb_group: 'er' },
  { infinitive: 'vivir',     english: 'to live',             frequency_rank: 32, verb_group: 'ir' },
  { infinitive: 'sentir',    english: 'to feel',             frequency_rank: 33, verb_group: 'irregular' },
  { infinitive: 'tratar',    english: 'to try / treat',      frequency_rank: 34, verb_group: 'ar' },
  { infinitive: 'mirar',     english: 'to look at / watch',  frequency_rank: 35, verb_group: 'ar' },
  { infinitive: 'contar',    english: 'to count / tell',     frequency_rank: 36, verb_group: 'ar' },
  { infinitive: 'empezar',   english: 'to begin / start',    frequency_rank: 37, verb_group: 'ar' },
  { infinitive: 'esperar',   english: 'to wait / hope',      frequency_rank: 38, verb_group: 'ar' },
  { infinitive: 'buscar',    english: 'to look for',         frequency_rank: 39, verb_group: 'ar' },
  { infinitive: 'existir',   english: 'to exist',            frequency_rank: 40, verb_group: 'ir' },
  { infinitive: 'entrar',    english: 'to enter',            frequency_rank: 41, verb_group: 'ar' },
  { infinitive: 'trabajar',  english: 'to work',             frequency_rank: 42, verb_group: 'ar' },
  { infinitive: 'escribir',  english: 'to write',            frequency_rank: 43, verb_group: 'ir' },
  { infinitive: 'perder',    english: 'to lose / miss',      frequency_rank: 44, verb_group: 'er' },
  { infinitive: 'producir',  english: 'to produce',          frequency_rank: 45, verb_group: 'irregular' },
  { infinitive: 'ocurrir',   english: 'to occur / happen',   frequency_rank: 46, verb_group: 'ir' },
  { infinitive: 'entender',  english: 'to understand',       frequency_rank: 47, verb_group: 'er' },
  { infinitive: 'pedir',     english: 'to ask for / request',frequency_rank: 48, verb_group: 'irregular' },
  { infinitive: 'recibir',   english: 'to receive',          frequency_rank: 49, verb_group: 'ir' },
  { infinitive: 'recordar',  english: 'to remember',         frequency_rank: 50, verb_group: 'ar' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type SentenceEntry = {
  pronoun: string
  sentence: string
  correct_form: string
  tense_rule: string
}

type ComboResult = {
  verb_infinitive: string
  verb_id: string
  tense: string
  sentences: SentenceEntry[]
}

type OutputFile = {
  generated_at: string
  combos: ComboResult[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getOutputPath() {
  const docsDir = path.join(process.cwd(), 'docs')
  fs.mkdirSync(docsDir, { recursive: true })
  return path.join(docsDir, `verb-sentences-${getTodayStr()}.json`)
}

function loadExisting(outputPath: string): OutputFile {
  if (fs.existsSync(outputPath)) {
    return JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as OutputFile
  }
  return { generated_at: new Date().toISOString(), combos: [] }
}

function saveOutput(outputPath: string, data: OutputFile) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
}

// ── Claude generation ─────────────────────────────────────────────────────────

const IMPERATIVE_TENSES = new Set(['imperative_affirmative', 'imperative_negative'])

function buildSentencePrompt(infinitive: string, tense: string): string {
  const tenseLabel = TENSE_LABELS[tense as keyof typeof TENSE_LABELS] ?? tense

  if (tense === 'imperative_affirmative') {
    return `Generate exactly 3 natural Spanish sentences using the verb "${infinitive}" in the Imperativo Afirmativo.
The imperative has no yo form. Use these 3 pronouns: tú, usted (use pronoun key "el"), nosotros.
Each sentence must contain exactly one blank (written as "_____") where the conjugated verb goes.
The sentences should be natural commands or instructions, appropriate for advanced Spanish learners (B1-B2 level).

Return a JSON array of exactly 3 objects:
[
  {
    "pronoun": "tu",
    "sentence": "_____ los documentos antes de salir.",
    "correct_form": "Firma",
    "tense_rule": "Imperativo afirmativo tú: uses 3rd person singular of present indicative (regular verbs)"
  },
  {
    "pronoun": "el",
    "sentence": "_____ usted un momento, por favor.",
    "correct_form": "Espere",
    "tense_rule": "Imperativo afirmativo usted: uses present subjunctive form"
  },
  {
    "pronoun": "nosotros",
    "sentence": "_____ juntos esta tarde.",
    "correct_form": "Estudiemos",
    "tense_rule": "Imperativo afirmativo nosotros: uses present subjunctive nosotros form"
  }
]
Only return the JSON array. No other text. The tense_rule should be a short, helpful rule (max 15 words).`
  }

  if (tense === 'imperative_negative') {
    return `Generate exactly 3 natural Spanish sentences using the verb "${infinitive}" in the Imperativo Negativo.
The imperative has no yo form. Use these 3 pronouns: tú, usted (use pronoun key "el"), nosotros.
Each sentence must start with "No" and contain exactly one blank (written as "_____") where the conjugated verb goes.
The correct_form should be ONLY the conjugated verb form (without "no").
The sentences should be natural prohibitions, appropriate for advanced Spanish learners (B1-B2 level).

Return a JSON array of exactly 3 objects:
[
  {
    "pronoun": "tu",
    "sentence": "No _____ el teléfono durante la reunión.",
    "correct_form": "uses",
    "tense_rule": "Imperativo negativo tú: no + present subjunctive tú form"
  },
  {
    "pronoun": "el",
    "sentence": "No _____ usted sin permiso.",
    "correct_form": "salga",
    "tense_rule": "Imperativo negativo usted: no + present subjunctive usted form"
  },
  {
    "pronoun": "nosotros",
    "sentence": "No _____ el tiempo en cosas sin importancia.",
    "correct_form": "perdamos",
    "tense_rule": "Imperativo negativo nosotros: no + present subjunctive nosotros form"
  }
]
Only return the JSON array. No other text. The tense_rule should be a short, helpful rule (max 15 words).`
  }

  // Default: non-imperative tenses use yo / tú / él
  return `Generate exactly 3 natural Spanish sentences using the verb "${infinitive}" in the ${tenseLabel} tense.
Use 3 different subject pronouns: yo, tú, él/ella.
Each sentence must contain exactly one blank (written as "_____") where the conjugated verb goes.
The sentences should be natural, varied, and appropriate for advanced Spanish learners (B1-B2 level).

Return a JSON array of exactly 3 objects:
[
  {
    "pronoun": "yo",
    "sentence": "Ayer yo _____ al mercado con mi familia.",
    "correct_form": "fui",
    "tense_rule": "ir/ser are irregular in preterite: fui, fuiste, fue, fuimos, fuisteis, fueron"
  },
  {
    "pronoun": "tu",
    "sentence": "...",
    "correct_form": "...",
    "tense_rule": "..."
  },
  {
    "pronoun": "el",
    "sentence": "...",
    "correct_form": "...",
    "tense_rule": "..."
  }
]
Only return the JSON array. No other text. The tense_rule should be a short, helpful rule (max 15 words).`
}

async function generateSentences(infinitive: string, tense: string): Promise<SentenceEntry[]> {
  const prompt = buildSentencePrompt(infinitive, tense)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // Strip markdown fences if present
  let text = content.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const parsed = JSON.parse(text) as SentenceEntry[]
  if (!Array.isArray(parsed) || parsed.length !== 3) {
    throw new Error(`Expected 3 sentences, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`)
  }

  // Validate imperative sentences don't use yo
  if (IMPERATIVE_TENSES.has(tense)) {
    for (const s of parsed) {
      if (s.pronoun === 'yo') {
        throw new Error(`Imperative sentence incorrectly uses pronoun "yo"`)
      }
    }
  }

  return parsed
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const outputPath = getOutputPath()
  const output = loadExisting(outputPath)

  // Build set of already-done combos
  const done = new Set(output.combos.map((c) => `${c.verb_infinitive}:${c.tense}`))

  console.log(`Output: ${outputPath}`)
  console.log(`Already done: ${done.size} / ${VERB_DATA.length * TENSES.length} combos`)

  // Step 1: Upsert verbs and get their IDs
  console.log('\n── Upserting verbs table ──')
  const { data: verbRows, error: verbErr } = await supabase
    .from('verbs')
    .upsert(VERB_DATA, { onConflict: 'infinitive' })
    .select('id, infinitive')

  if (verbErr || !verbRows) {
    console.error('Failed to upsert verbs:', verbErr)
    process.exit(1)
  }

  const verbIdMap = new Map(verbRows.map((v) => [v.infinitive, v.id]))
  console.log(`Verbs in DB: ${verbRows.length}`)

  // Step 2: Generate sentences for each combo
  let generated = 0
  let errors = 0

  for (const verb of VERB_DATA) {
    const verbId = verbIdMap.get(verb.infinitive)
    if (!verbId) {
      console.warn(`No ID for verb: ${verb.infinitive}`)
      continue
    }

    for (const tense of TENSES) {
      const key = `${verb.infinitive}:${tense}`
      if (done.has(key)) continue

      try {
        console.log(`Generating: ${verb.infinitive} / ${TENSE_LABELS[tense]}`)
        const sentences = await generateSentences(verb.infinitive, tense)

        output.combos.push({
          verb_infinitive: verb.infinitive,
          verb_id:         verbId,
          tense,
          sentences,
        })

        saveOutput(outputPath, output)
        done.add(key)
        generated++

        // 300ms delay between API calls
        await delay(300)
      } catch (err) {
        console.error(`Error for ${verb.infinitive}/${tense}:`, err)
        errors++
      }
    }
  }

  console.log(`\n✓ Done. Generated: ${generated}, Errors: ${errors}`)
  console.log(`Total combos: ${output.combos.length}`)
  console.log(`\nReview the output at: ${outputPath}`)
  console.log('Then run: pnpm seed:verbs:apply <path>')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
