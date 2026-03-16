/**
 * pnpm backfill:translations
 *
 * Backfills the `english` column on `verb_sentences` using Claude Haiku.
 * Resume-safe: only fetches rows where `english IS NULL`.
 * Processes in batches of 20 sentences per API call.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm backfill:translations
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '../src/lib/supabase/types'

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

const BATCH_SIZE = 20
const MODEL = 'claude-haiku-4-5-20251001'

// ── Output file ──────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)
const outPath = path.join('docs', `verb-translations-${today}.json`)

interface TranslationEntry {
  id: string
  sentence: string
  correct_form: string
  english: string
}

function loadProgress(): TranslationEntry[] {
  if (fs.existsSync(outPath)) {
    return JSON.parse(fs.readFileSync(outPath, 'utf-8')) as TranslationEntry[]
  }
  return []
}

function saveProgress(entries: TranslationEntry[]) {
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2))
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching verb_sentences where english IS NULL...')

  const { data: rows, error } = await supabase
    .from('verb_sentences')
    .select('id, sentence, correct_form')
    .is('english', null)
    .order('id')

  if (error) {
    console.error('DB fetch error:', error.message)
    process.exit(1)
  }

  type SentenceRow = { id: string; sentence: string; correct_form: string }
  const sentences = (rows ?? []) as SentenceRow[]
  console.log(`Found ${sentences.length} sentences to translate.`)

  if (sentences.length === 0) {
    console.log('Nothing to do.')
    return
  }

  const progress = loadProgress()
  const doneIds = new Set(progress.map((e) => e.id))
  const remaining = sentences.filter((s) => !doneIds.has(s.id))
  console.log(`${remaining.length} remaining after resume check.`)

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(remaining.length / BATCH_SIZE)

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} sentences)...`)

    const prompt = batch.map((s, idx) => {
      const completed = s.sentence.replace('_____', s.correct_form)
      return `${idx + 1}. ${completed}`
    }).join('\n')

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: 'You are a professional Spanish-to-English translator. Translate each numbered Spanish sentence to natural English. Return ONLY a JSON array of strings, one translation per input sentence, in the same order. No explanations.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let translations: string[]

    try {
      // Extract JSON array from response (may have markdown fences)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found')
      translations = JSON.parse(jsonMatch[0]) as string[]
    } catch (e) {
      console.error(`Failed to parse batch ${batchNum} response:`, text.slice(0, 200))
      console.error('Skipping batch...')
      continue
    }

    if (translations.length !== batch.length) {
      console.warn(`Batch ${batchNum}: expected ${batch.length} translations, got ${translations.length}. Skipping.`)
      continue
    }

    // Update DB and save progress
    for (let j = 0; j < batch.length; j++) {
      const { id, sentence, correct_form } = batch[j]
      const english = translations[j].trim()

      const { error: updateError } = await supabase
        .from('verb_sentences')
        .update({ english })
        .eq('id', id)

      if (updateError) {
        console.error(`Failed to update ${id}:`, updateError.message)
        continue
      }

      progress.push({ id, sentence, correct_form, english })
    }

    saveProgress(progress)
    console.log(`  ✓ ${progress.length} total translated`)
  }

  console.log(`\nDone! ${progress.length} translations saved to ${outPath}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
