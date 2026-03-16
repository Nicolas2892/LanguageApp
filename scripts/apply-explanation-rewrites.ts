/**
 * Apply rewritten explanations from the audit JSON back to Supabase.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm exec tsx scripts/apply-explanation-rewrites.ts [--dry-run] <file>
 *
 * Only updates rows where _quality === 'rewrite' and _rewrite is non-empty.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const filePath = args.find((a) => !a.startsWith('--'))

if (!filePath) {
  console.error('Usage: apply-explanation-rewrites.ts [--dry-run] <path-to-audit-json>')
  process.exit(1)
}

interface AuditEntry {
  id: string
  title: string
  explanation: string
  _quality: string | null
  _rewrite: string | null
}

const supabase = createClient(url, key)

async function main() {
  const entries: AuditEntry[] = JSON.parse(readFileSync(filePath!, 'utf-8'))
  const rewrites = entries.filter((e) => e._quality === 'rewrite' && e._rewrite)

  console.log(`Found ${rewrites.length} rewrite(s) out of ${entries.length} entries`)

  if (dryRun) {
    for (const r of rewrites) {
      console.log(`\n[DRY RUN] ${r.title}`)
      console.log(`  OLD: ${r.explanation.slice(0, 80)}...`)
      console.log(`  NEW: ${r._rewrite!.slice(0, 80)}...`)
    }
    return
  }

  let updated = 0
  for (const r of rewrites) {
    const { error } = await supabase
      .from('concepts')
      .update({ explanation: r._rewrite })
      .eq('id', r.id)

    if (error) {
      console.error(`  FAIL: ${r.title} — ${error.message}`)
    } else {
      console.log(`  OK: ${r.title}`)
      updated++
    }
  }

  console.log(`\nUpdated ${updated}/${rewrites.length} explanations`)
}

main()
