import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type UnifiedDueItem =
  | { type: 'concept'; conceptId: string }
  | { type: 'verb'; verbId: string; tense: string }
  | { type: 'vocab'; vocabId: string }

/**
 * Fetch all due items across grammar, verbs, and vocab.
 * Runs 3 parallel queries and merges results.
 */
export async function fetchUnifiedDueQueue(
  supabase: SupabaseClient<Database>,
  userId: string,
  today: string,
  limit = 30,
): Promise<UnifiedDueItem[]> {
  const [grammarRes, verbRes, vocabRes] = await Promise.all([
    supabase
      .from('user_progress')
      .select('concept_id')
      .eq('user_id', userId)
      .lte('due_date', today)
      .limit(limit),
    supabase
      .from('srs_items')
      .select('verb_id, tense')
      .eq('user_id', userId)
      .eq('item_type', 'verb')
      .lte('due_date', today)
      .limit(limit),
    supabase
      .from('srs_items')
      .select('vocab_id')
      .eq('user_id', userId)
      .eq('item_type', 'vocab')
      .lte('due_date', today)
      .limit(limit),
  ])

  const items: UnifiedDueItem[] = []

  for (const row of (grammarRes.data ?? []) as Array<{ concept_id: string }>) {
    items.push({ type: 'concept', conceptId: row.concept_id })
  }
  for (const row of (verbRes.data ?? []) as Array<{ verb_id: string; tense: string }>) {
    if (row.verb_id && row.tense) {
      items.push({ type: 'verb', verbId: row.verb_id, tense: row.tense })
    }
  }
  for (const row of (vocabRes.data ?? []) as Array<{ vocab_id: string }>) {
    if (row.vocab_id) {
      items.push({ type: 'vocab', vocabId: row.vocab_id })
    }
  }

  return items
}

/**
 * Get total count of due items across all content types.
 * Grammar from user_progress, verbs+vocab from srs_items.
 */
export async function fetchUnifiedDueCount(
  supabase: SupabaseClient<Database>,
  userId: string,
  today: string,
): Promise<number> {
  const [grammarRes, srsRes] = await Promise.all([
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('due_date', today),
    supabase
      .from('srs_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('due_date', today),
  ])

  return (grammarRes.count ?? 0) + (srsRes.count ?? 0)
}
