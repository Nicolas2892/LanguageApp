/**
 * Truncate all curriculum tables in dependency order.
 * user_progress + exercise_attempts cascade automatically when concepts/exercises are deleted.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx src/lib/curriculum/run-truncate.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY)

async function truncate() {
  console.log('🗑️  Truncating curriculum tables...\n')

  // Delete in FK order. Cascade from modules wipes units → concepts → exercises.
  // Cascade from concepts also wipes user_progress.
  // Cascade from exercises also wipes exercise_attempts.
  // We use a always-true filter (.neq) because the Supabase client requires at least one filter.

  const { error: exErr, count: exCount } = await supabase
    .from('exercises').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
  if (exErr) throw new Error(`exercises: ${exErr.message}`)
  console.log(`  exercises deleted: ${exCount}`)

  const { error: cErr, count: cCount } = await supabase
    .from('concepts').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
  if (cErr) throw new Error(`concepts: ${cErr.message}`)
  console.log(`  concepts deleted:  ${cCount}`)

  const { error: uErr, count: uCount } = await supabase
    .from('units').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
  if (uErr) throw new Error(`units: ${uErr.message}`)
  console.log(`  units deleted:     ${uCount}`)

  const { error: mErr, count: mCount } = await supabase
    .from('modules').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
  if (mErr) throw new Error(`modules: ${mErr.message}`)
  console.log(`  modules deleted:   ${mCount}`)

  console.log('\n✅ Truncation complete. Run pnpm seed to re-populate.')
}

truncate().catch((err) => {
  console.error('❌ Truncation failed:', err.message)
  process.exit(1)
})
