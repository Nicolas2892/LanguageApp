/**
 * pnpm seed:conjugations
 *
 * For each of the 50 verbs × 7 tenses (350 combos), calls Claude Haiku to
 * generate the full 6-pronoun conjugation table plus the invariant stem.
 *
 * Output: docs/verb-conjugations-YYYY-MM-DD.json (resume-safe)
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm seed:conjugations
 *
 * Then apply with:
 *   pnpm seed:conjugations:apply docs/verb-conjugations-YYYY-MM-DD.json
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

// ── Types ─────────────────────────────────────────────────────────────────────

type ConjugationEntry = {
  stem: string      // longest invariant prefix; '' for fully irregular
  yo: string
  tu: string
  el: string
  nosotros: string
  vosotros: string
  ellos: string
}

type ComboResult = {
  verb_infinitive: string
  verb_id: string
  tense: string
  conjugations: ConjugationEntry
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
  return path.join(docsDir, `verb-conjugations-${getTodayStr()}.json`)
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

function buildConjugationPrompt(infinitive: string, tense: string): string {
  const tenseLabel = TENSE_LABELS[tense as keyof typeof TENSE_LABELS] ?? tense

  if (tense === 'imperative_affirmative') {
    return `Provide the Imperativo Afirmativo conjugation of the Spanish verb "${infinitive}" for the 5 applicable pronouns.
The imperative has NO yo form — set yo to an empty string "".
Use "el" for the usted form and "ellos" for the ustedes form.

Also provide the "stem": the longest prefix shared by ALL non-empty forms (tu, el, nosotros, vosotros, ellos). Set stem to "" if no common prefix.

Examples for hablar:
- tu=habla, el=hable, nosotros=hablemos, vosotros=hablad, ellos=hablen → stem="habl"

Return ONLY a JSON object, no other text:
{
  "stem": "habl",
  "yo": "",
  "tu": "habla",
  "el": "hable",
  "nosotros": "hablemos",
  "vosotros": "hablad",
  "ellos": "hablen"
}`
  }

  if (tense === 'imperative_negative') {
    return `Provide the Imperativo Negativo conjugation of the Spanish verb "${infinitive}" for the 5 applicable pronouns.
The imperative has NO yo form — set yo to an empty string "".
Use "el" for the usted form and "ellos" for the ustedes form.
Store ONLY the verb form (without "no") — e.g. "hables" not "no hables".
The negative imperative uses present subjunctive forms.

Also provide the "stem": the longest prefix shared by ALL non-empty forms. Set stem to "" if no common prefix.

Examples for hablar:
- tu=hables, el=hable, nosotros=hablemos, vosotros=habléis, ellos=hablen → stem="habl"

Return ONLY a JSON object, no other text:
{
  "stem": "habl",
  "yo": "",
  "tu": "hables",
  "el": "hable",
  "nosotros": "hablemos",
  "vosotros": "habléis",
  "ellos": "hablen"
}`
  }

  // Default: all 6 pronouns
  return `Provide the complete conjugation of the Spanish verb "${infinitive}" in the ${tenseLabel} tense for all 6 pronouns (yo, tú, él/ella, nosotros, vosotros, ellos/ellas).

Also provide the "stem": the longest prefix shared by ALL 6 forms. If the forms have no common prefix (fully irregular), set stem to an empty string "".

Examples:
- hablar, presente: yo=hablo, tú=hablas, él=habla, nosotros=hablamos, vosotros=habláis, ellos=hablan → stem="habl"
- ser, presente: yo=soy, tú=eres, él=es, nosotros=somos, vosotros=sois, ellos=son → stem="" (fully irregular)
- comer, presente: yo=como, tú=comes, él=come, nosotros=comemos, vosotros=coméis, ellos=comen → stem="com"

Return ONLY a JSON object, no other text:
{
  "stem": "habl",
  "yo": "hablo",
  "tu": "hablas",
  "el": "habla",
  "nosotros": "hablamos",
  "vosotros": "habláis",
  "ellos": "hablan"
}`
}

async function generateConjugations(infinitive: string, tense: string): Promise<ConjugationEntry> {
  const prompt = buildConjugationPrompt(infinitive, tense)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let text = content.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const parsed = JSON.parse(text) as ConjugationEntry
  const required = ['stem', 'yo', 'tu', 'el', 'nosotros', 'vosotros', 'ellos'] as const
  for (const key of required) {
    if (typeof parsed[key] !== 'string') {
      throw new Error(`Missing or invalid field: ${key}`)
    }
  }
  return parsed
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const outputPath = getOutputPath()
  const output = loadExisting(outputPath)

  const done = new Set(output.combos.map((c) => `${c.verb_infinitive}:${c.tense}`))

  console.log(`Output: ${outputPath}`)
  console.log(`Already done: ${done.size} / ${350} combos`)

  // Load verbs from DB
  const { data: verbRows, error: verbErr } = await supabase
    .from('verbs')
    .select('id, infinitive')
    .order('frequency_rank')

  if (verbErr || !verbRows) {
    console.error('Failed to fetch verbs:', verbErr)
    process.exit(1)
  }

  const verbIdMap = new Map(verbRows.map((v) => [v.infinitive as string, v.id as string]))
  console.log(`Verbs in DB: ${verbRows.length}`)

  let generated = 0
  let errors = 0

  for (const verb of verbRows) {
    const verbInfinitive = verb.infinitive as string
    const verbId = verb.id as string

    for (const tense of TENSES) {
      const key = `${verbInfinitive}:${tense}`
      if (done.has(key)) continue

      try {
        console.log(`Generating: ${verbInfinitive} / ${TENSE_LABELS[tense]}`)
        const conjugations = await generateConjugations(verbInfinitive, tense)

        output.combos.push({
          verb_infinitive: verbInfinitive,
          verb_id:         verbId,
          tense,
          conjugations,
        })

        saveOutput(outputPath, output)
        done.add(key)
        generated++

        await delay(200)
      } catch (err) {
        console.error(`Error for ${verbInfinitive}/${tense}:`, err)
        errors++
      }
    }
  }

  const skippedVerbCount = 350 - verbRows.length * TENSES.length
  console.log(`\n✓ Done. Generated: ${generated}, Errors: ${errors}`)
  if (skippedVerbCount !== 0) {
    console.log(`(Expected ${verbRows.length * TENSES.length} combos — run pnpm seed:verbs first if verbs are missing)`)
  }
  console.log(`Total combos in file: ${output.combos.length}`)
  console.log(`\nReview the output at: ${outputPath}`)
  console.log(`Then run: pnpm seed:conjugations:apply ${outputPath}`)

  void verbIdMap
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
