/**
 * Dump all concept explanations from Supabase for quality audit.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm exec tsx scripts/dump-explanations.ts
 *
 * Output: docs/explanation-audit.json
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const { data: concepts, error } = await supabase
    .from('concepts')
    .select('id, title, level, explanation, difficulty')
    .order('level')
    .order('difficulty')

  if (error) {
    console.error('Error fetching concepts:', error.message)
    process.exit(1)
  }

  const output = (concepts ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    level: c.level,
    difficulty: c.difficulty,
    explanation: c.explanation,
    // Reviewer fills these in:
    _quality: null as string | null, // 'good' | 'rewrite'
    _rewrite: null as string | null, // replacement text if quality is 'rewrite'
  }))

  const outPath = join(process.cwd(), 'docs', 'explanation-audit.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')
  console.log(`Wrote ${output.length} concepts to ${outPath}`)
}

main()
