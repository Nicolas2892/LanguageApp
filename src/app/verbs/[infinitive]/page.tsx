import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerbDetailClient } from './VerbDetailClient'
import type { Verb, VerbConjugation, VerbProgress } from '@/lib/supabase/types'
import { TENSES } from '@/lib/verbs/constants'

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

  // Fetch conjugations + favorites + progress in parallel
  const [
    { data: conjugationRows },
    { data: favoriteRow },
    { data: progressRows },
  ] = await Promise.all([
    supabase
      .from('verb_conjugations')
      .select('tense, stem, yo, tu, el, nosotros, vosotros, ellos')
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

  const conjugations = conjugationRows as Pick<VerbConjugation, 'tense' | 'stem' | 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'>[] ?? []
  const favorited = !!favoriteRow
  const progress = progressRows as Pick<VerbProgress, 'tense' | 'attempt_count' | 'correct_count'>[] ?? []

  // Build a tense → progress map
  const progressMap = new Map(progress.map((p) => [p.tense, p]))

  // Build tenseData: all 6 conjugation rows + mastery per tense
  const tenseData = TENSES.map((tense) => {
    const conj = conjugations.find((c) => c.tense === tense)

    const rows = conj
      ? [
          { pronoun: 'yo',       form: conj.yo,       stem: conj.stem },
          { pronoun: 'tu',       form: conj.tu,        stem: conj.stem },
          { pronoun: 'el',       form: conj.el,        stem: conj.stem },
          { pronoun: 'nosotros', form: conj.nosotros,  stem: conj.stem },
          { pronoun: 'vosotros', form: conj.vosotros,  stem: conj.stem },
          { pronoun: 'ellos',    form: conj.ellos,     stem: conj.stem },
        ]
      : []

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
