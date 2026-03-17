import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerbSession } from './VerbSession'
import type { SessionItem } from './VerbSession'
import type { VerbSentence, Verb } from '@/lib/supabase/types'
import { TENSES, CONJUGATION_TENSES } from '@/lib/verbs/constants'

interface Props {
  searchParams: Promise<{
    tenses?: string
    verbSet?: string
    verb?: string
    length?: string
    hint?: string
  }>
}

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default async function VerbSessionPage({ searchParams }: Props) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Parse config from query params
  const selectedTenses = (params.tenses ?? 'present_indicative')
    .split(',')
    .filter((t) => (TENSES as readonly string[]).includes(t))

  if (selectedTenses.length === 0) redirect('/verbs/configure')

  const verbSet = params.verbSet ?? 'top25'
  const sessionLength = Math.min(30, Math.max(1, parseInt(params.length ?? '10', 10) || 10))
  const showHint = params.hint === '1'

  // Resolve verb IDs based on verbSet
  let verbIds: string[] = []

  if (verbSet === 'favorites') {
    const { data: favRows } = await supabase
      .from('user_verb_favorites')
      .select('verb_id')
      .eq('user_id', user.id)
    verbIds = (favRows ?? []).map((r) => (r as { verb_id: string }).verb_id)
    if (verbIds.length === 0) redirect('/verbs/configure')
  } else if (verbSet === 'single' && params.verb) {
    const { data: verbRow } = await supabase
      .from('verbs')
      .select('id')
      .eq('infinitive', params.verb)
      .single()
    if (verbRow) verbIds = [(verbRow as Pick<Verb, 'id'>).id]
    if (verbIds.length === 0) redirect('/verbs/configure')
  } else if (verbSet === 'irregular') {
    const { data: verbRows } = await supabase
      .from('verbs')
      .select('id')
      .eq('verb_group', 'irregular')
      .order('frequency_rank')
    verbIds = (verbRows as Pick<Verb, 'id'>[] ?? []).map((v) => v.id)
    if (verbIds.length === 0) redirect('/verbs/configure')
  } else {
    // top25, top50, top100, or top250
    const limit = verbSet === 'top250' ? 250 : verbSet === 'top100' ? 100 : verbSet === 'top50' ? 50 : 25
    const { data: verbRows } = await supabase
      .from('verbs')
      .select('id')
      .order('frequency_rank')
      .limit(limit)
    verbIds = (verbRows as Pick<Verb, 'id'>[] ?? []).map((v) => v.id)
  }

  // Split tenses into conjugation tenses vs infinitive
  const conjugationTenses = selectedTenses.filter((t) =>
    (CONJUGATION_TENSES as readonly string[]).includes(t)
  )
  const hasInfinitive = selectedTenses.includes('infinitive')

  // Fetch verb data + sentences in parallel
  const sentenceQuery = conjugationTenses.length > 0
    ? supabase
        .from('verb_sentences')
        .select('id, verb_id, tense, pronoun, sentence, correct_form, tense_rule, english')
        .in('verb_id', verbIds)
        .in('tense', conjugationTenses)
    : null
  const verbQuery = supabase
    .from('verbs')
    .select('id, infinitive, english')
    .in('id', verbIds)

  const [sentenceResult, verbResult] = await Promise.all([
    sentenceQuery ?? Promise.resolve({ data: [] as unknown[] }),
    verbQuery,
  ])

  type SentenceRow = Pick<VerbSentence, 'id' | 'verb_id' | 'tense' | 'pronoun' | 'sentence' | 'correct_form' | 'tense_rule' | 'english'>
  const sentences = sentenceResult.data as SentenceRow[] ?? []

  type VerbRow = Pick<Verb, 'id' | 'infinitive' | 'english'>
  const verbs = verbResult.data as VerbRow[] ?? []

  // Build verb_id → verb lookup
  const infinitiveMap = new Map(verbs.map((v) => [v.id, v.infinitive]))

  // Build conjugation items
  const conjugationItems: SessionItem[] = sentences.map((s) => ({
    verbId:      s.verb_id,
    infinitive:  infinitiveMap.get(s.verb_id) ?? '',
    tense:       s.tense,
    pronoun:     s.pronoun,
    sentence:    s.sentence,
    correctForm: s.correct_form,
    tenseRule:   s.tense_rule,
    english:     s.english ?? null,
  }))

  // Build infinitive drill items
  const infinitiveItems: SessionItem[] = hasInfinitive
    ? verbs.map((v) => ({
        verbId:      v.id,
        infinitive:  v.infinitive,
        tense:       'infinitive',
        pronoun:     '',
        sentence:    v.english ?? v.infinitive,
        correctForm: v.infinitive,
        tenseRule:   '',
        english:     null,
      }))
    : []

  const allItems = [...conjugationItems, ...infinitiveItems]
  if (allItems.length === 0) redirect('/verbs/configure')

  // Shuffle and take up to sessionLength
  const items: SessionItem[] = shuffle(allItems).slice(0, sessionLength)

  // Build the "practice again" URL to the same session config
  const sessionUrl = `/verbs/session?${new URLSearchParams({
    tenses:   selectedTenses.join(','),
    verbSet,
    ...(params.verb ? { verb: params.verb } : {}),
    length:   String(sessionLength),
    ...(showHint ? { hint: '1' } : {}),
  }).toString()}`

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <VerbSession items={items} showHint={showHint} sessionUrl={sessionUrl} />
    </main>
  )
}
