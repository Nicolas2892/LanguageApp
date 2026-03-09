import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerbDetailClient } from './VerbDetailClient'
import type { Verb, VerbSentence, VerbProgress } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ infinitive: string }>
}

export default async function VerbDetailPage({ params }: Props) {
  const { infinitive } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch verb by infinitive
  const { data: verbData } = await supabase
    .from('verbs')
    .select('*')
    .eq('infinitive', decodeURIComponent(infinitive))
    .single()

  if (!verbData) notFound()
  const verb = verbData as Verb

  // Fetch sentences + favorites + progress in parallel
  const [
    { data: sentenceRows },
    { data: favoriteRow },
    { data: progressRows },
  ] = await Promise.all([
    supabase
      .from('verb_sentences')
      .select('tense, pronoun, correct_form, tense_rule')
      .eq('verb_id', verb.id),
    supabase
      .from('user_verb_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('verb_id', verb.id)
      .single(),
    supabase
      .from('verb_progress')
      .select('tense, attempt_count, correct_count')
      .eq('user_id', user.id)
      .eq('verb_id', verb.id),
  ])

  const sentences = sentenceRows as Pick<VerbSentence, 'tense' | 'pronoun' | 'correct_form' | 'tense_rule'>[] ?? []
  const favorited = !!favoriteRow
  const progress = progressRows as Pick<VerbProgress, 'tense' | 'attempt_count' | 'correct_count'>[] ?? []

  // Build a tense → progress map
  const progressMap = new Map(progress.map((p) => [p.tense, p]))

  // Build tenseData: conjugation table rows + mastery per tense
  const tenseData = ['present_indicative','preterite','imperfect','future','conditional','present_subjunctive','imperfect_subjunctive'].map((tense) => {
    const tenseSentences = sentences.filter((s) => s.tense === tense)
    // Deduplicate pronouns (keep first occurrence per pronoun)
    const seen = new Set<string>()
    const rows = tenseSentences
      .filter((s) => {
        if (seen.has(s.pronoun)) return false
        seen.add(s.pronoun)
        return true
      })
      .map((s) => ({ pronoun: s.pronoun, correct_form: s.correct_form }))

    const prog = progressMap.get(tense)
    const masteryPct = prog && prog.attempt_count > 0
      ? Math.round((prog.correct_count / prog.attempt_count) * 100)
      : null
    const attempts = prog?.attempt_count ?? 0

    return { tense, rows, masteryPct, attempts }
  })

  return (
    <VerbDetailClient
      verbId={verb.id}
      infinitive={verb.infinitive}
      english={verb.english}
      verbGroup={verb.verb_group}
      favorited={favorited}
      tenseData={tenseData}
    />
  )
}
