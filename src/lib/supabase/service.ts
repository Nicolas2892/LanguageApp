/**
 * Service-role Supabase client — server-only.
 * Bypasses RLS so it can read cross-user data (aggregate stats, etc.).
 * Never expose to the browser or import from client components.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
