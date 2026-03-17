import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  Verb,
  VerbSentence,
  VerbConjugation,
  VerbProgress,
} from '@/lib/supabase/types'
import * as Sentry from '@sentry/nextjs'

/**
 * GET /api/offline/verbs?version=<timestamp>
 *
 * Returns the full verb data bundle for offline caching.
 * If `?version=<timestamp>` matches the server's latest verb data timestamp,
 * returns 304 Not Modified.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check staleness via version query param
    const url = new URL(request.url)
    const clientVersion = url.searchParams.get('version')

    // Fetch all verbs to get a rough "latest" timestamp
    const { data: rawVerbs } = await supabase
      .from('verbs')
      .select('id, infinitive, english, frequency_rank, verb_group, created_at')
      .order('frequency_rank')
    const verbs = (rawVerbs ?? []) as (Verb)[]

    // Use the most recent verb created_at as the server version
    const serverVersion = verbs.length > 0
      ? new Date(verbs[verbs.length - 1].created_at).getTime()
      : 0

    if (clientVersion && Number(clientVersion) >= serverVersion) {
      return new NextResponse(null, { status: 304 })
    }

    // Fetch verb sentences
    const { data: rawSentences } = await supabase
      .from('verb_sentences')
      .select('id, verb_id, tense, pronoun, sentence, correct_form, tense_rule, english')
    const verbSentences = (rawSentences ?? []) as Omit<VerbSentence, 'created_at'>[]

    // Fetch verb conjugations
    const { data: rawConjugations } = await supabase
      .from('verb_conjugations')
      .select('verb_id, tense, stem, yo, tu, el, nosotros, vosotros, ellos')
    const verbConjugations = (rawConjugations ?? []) as VerbConjugation[]

    // Fetch user favorites
    const { data: rawFavorites } = await supabase
      .from('user_verb_favorites')
      .select('verb_id')
      .eq('user_id', user.id)
    const userFavorites = (rawFavorites ?? []).map(f => (f as { verb_id: string }).verb_id)

    // Fetch user verb progress
    const { data: rawProgress } = await supabase
      .from('verb_progress')
      .select('verb_id, tense, attempt_count, correct_count')
      .eq('user_id', user.id)
    const userProgress = (rawProgress ?? []) as Pick<VerbProgress, 'verb_id' | 'tense' | 'attempt_count' | 'correct_count'>[]

    return NextResponse.json({
      verbs: verbs.map(({ id, infinitive, english, frequency_rank, verb_group }) => ({
        id, infinitive, english, frequency_rank, verb_group,
      })),
      verb_sentences: verbSentences,
      verb_conjugations: verbConjugations,
      user_favorites: userFavorites,
      user_progress: userProgress,
      version: serverVersion,
    }, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    })
  } catch (err) {
    Sentry.captureException(err)
    console.error('[offline/verbs] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
