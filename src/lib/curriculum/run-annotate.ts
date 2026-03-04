/**
 * CLI entry point for annotating exercises with grammatical span data.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm annotate
 */

import { annotateExercises } from './annotate-exercises'

annotateExercises().catch((err) => {
  console.error('❌ Annotation failed:', err.message)
  process.exit(1)
})
