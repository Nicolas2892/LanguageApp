import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { VerbDirectory } from './VerbDirectory'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
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
    supabase.from('verbs').select('*').order('infinitive'),
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

  // Compute mastery summary
  let practicados = 0
  let dominados = 0
  for (const v of verbItems) {
    const tenses = Object.values(v.masteryByTense)
    if (tenses.some((t) => t.attempts > 0)) {
      practicados++
      const attemptedTenses = tenses.filter((t) => t.attempts > 0)
      if (attemptedTenses.length > 0 && attemptedTenses.every((t) => Math.round((t.correct / t.attempts) * 100) >= 70)) {
        dominados++
      }
    }
  }

  return (
    <main className="relative overflow-hidden max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:pb-10 animate-page-in">
      <BackgroundMagicS />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="senda-heading text-2xl">Verbos</h1>
          <p className="senda-eyebrow mt-2">
            {verbs.length} verbos de alta frecuencia
          </p>
          {practicados > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--d5-body)' }}>
              {practicados} practicados · {dominados} dominados
            </p>
          )}
        </div>
        <Link
          href="/verbs/configure"
          className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Practicar →
        </Link>
      </div>

      <VerbDirectory verbs={verbItems} />
    </main>
  )
}
