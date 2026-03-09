import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { VerbDirectory } from './VerbDirectory'
import type { Verb, VerbProgress, UserVerbFavorite } from '@/lib/supabase/types'

export default async function VerbsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all verbs, user favorites, and user verb progress in parallel
  const [
    { data: verbRows },
    { data: favoriteRows },
    { data: progressRows },
  ] = await Promise.all([
    supabase.from('verbs').select('*').order('frequency_rank'),
    supabase.from('user_verb_favorites').select('verb_id').eq('user_id', user.id),
    supabase.from('verb_progress').select('verb_id, tense, attempt_count, correct_count').eq('user_id', user.id),
  ])

  const verbs = (verbRows as Verb[] ?? [])
  const favoriteSet = new Set((favoriteRows as Pick<UserVerbFavorite, 'verb_id'>[] ?? []).map((f) => f.verb_id))

  // Build mastery map: verb_id → tense → { attempts, correct }
  type MasteryMap = Record<string, Record<string, { attempts: number; correct: number }>>
  const masteryMap: MasteryMap = {}
  for (const row of (progressRows as Pick<VerbProgress, 'verb_id' | 'tense' | 'attempt_count' | 'correct_count'>[] ?? [])) {
    if (!masteryMap[row.verb_id]) masteryMap[row.verb_id] = {}
    masteryMap[row.verb_id][row.tense] = {
      attempts: row.attempt_count,
      correct:  row.correct_count,
    }
  }

  const verbItems = verbs.map((v) => ({
    id:            v.id,
    infinitive:    v.infinitive,
    english:       v.english,
    verb_group:    v.verb_group,
    favorited:     favoriteSet.has(v.id),
    masteryByTense: masteryMap[v.id] ?? {},
  }))

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verb Conjugation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {verbs.length} high-frequency verbs · type the conjugated form in context
          </p>
        </div>
        <Link
          href="/verbs/configure"
          className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Start Practice
        </Link>
      </div>

      <VerbDirectory verbs={verbItems} />
    </main>
  )
}
