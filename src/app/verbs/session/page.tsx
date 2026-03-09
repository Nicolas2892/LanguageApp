import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerbSession } from './VerbSession'
import type { SessionItem } from './VerbSession'
import type { VerbSentence, Verb } from '@/lib/supabase/types'
import { TENSES } from '@/lib/verbs/constants'

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
  } else {
    // top25 or top50
    const limit = verbSet === 'top50' ? 50 : 25
    const { data: verbRows } = await supabase
      .from('verbs')
      .select('id')
      .order('frequency_rank')
      .limit(limit)
    verbIds = (verbRows as Pick<Verb, 'id'>[] ?? []).map((v) => v.id)
  }

  // Fetch sentences + verb infinitives in parallel
  const [{ data: sentenceRows }, { data: verbRows2 }] = await Promise.all([
    supabase
      .from('verb_sentences')
      .select('id, verb_id, tense, pronoun, sentence, correct_form, tense_rule')
      .in('verb_id', verbIds)
      .in('tense', selectedTenses),
    supabase
      .from('verbs')
      .select('id, infinitive')
      .in('id', verbIds),
  ])

  type SentenceRow = Pick<VerbSentence, 'id' | 'verb_id' | 'tense' | 'pronoun' | 'sentence' | 'correct_form' | 'tense_rule'>
  const sentences = sentenceRows as SentenceRow[] ?? []

  // Build verb_id → infinitive lookup
  const infinitiveMap = new Map(
    (verbRows2 as Pick<Verb, 'id' | 'infinitive'>[] ?? []).map((v) => [v.id, v.infinitive])
  )

  if (sentences.length === 0) redirect('/verbs/configure')

  // Shuffle and take up to sessionLength
  const shuffled = shuffle(sentences).slice(0, sessionLength)

  const items: SessionItem[] = shuffled.map((s) => ({
    verbId:      s.verb_id,
    infinitive:  infinitiveMap.get(s.verb_id) ?? '',
    tense:       s.tense,
    pronoun:     s.pronoun,
    sentence:    s.sentence,
    correctForm: s.correct_form,
    tenseRule:   s.tense_rule,
  }))

  // Build the "practice again" URL to the same session config
  const sessionUrl = `/verbs/session?${new URLSearchParams({
    tenses:   selectedTenses.join(','),
    verbSet,
    ...(params.verb ? { verb: params.verb } : {}),
    length:   String(sessionLength),
    ...(showHint ? { hint: '1' } : {}),
  }).toString()}`

  return <VerbSession items={items} showHint={showHint} sessionUrl={sessionUrl} />
}
