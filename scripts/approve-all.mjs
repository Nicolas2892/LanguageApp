#!/usr/bin/env node
/**
 * Marks all entries in a curriculum-review JSON file as _approved: true.
 * Usage: node scripts/approve-all.mjs <file>
 */
import { readFileSync, writeFileSync } from 'fs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/approve-all.mjs <file>')
  process.exit(1)
}

const entries = JSON.parse(readFileSync(file, 'utf8'))
const approved = entries.map(e => ({ ...e, _approved: true }))
writeFileSync(file, JSON.stringify(approved, null, 2), 'utf8')

const byMode = approved.reduce((acc, e) => {
  acc[e._mode] = (acc[e._mode] ?? 0) + 1
  return acc
}, {})
console.log(`✅ Approved ${approved.length} entries:`)
Object.entries(byMode).forEach(([mode, count]) => console.log(`   ${mode}: ${count}`))
console.log(`\nFile written: ${file}`)
