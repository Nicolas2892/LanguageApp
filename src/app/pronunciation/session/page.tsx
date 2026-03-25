import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import { PronunciationSession } from './PronunciationSession'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { VerbSentence, VocabSentence } from '@/lib/supabase/types'

interface PronunciationItem {
  id: string
  displayText: string
  source: 'verb' | 'vocab'
}

export default async function PronunciationSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  // Fetch user's L1 language for tips
  const { data: profile } = await supabase
    .from('profiles')
    .select('l1_language')
    .eq('id', user.id)
    .single()
  const l1Language = (profile as { l1_language: string | null } | null)?.l1_language ?? null

  // Fetch random sentences from verb_sentences + vocab_sentences
  // Supabase doesn't support UNION, so fetch 5 from each and shuffle
  const [{ data: verbRows }, { data: vocabRows }] = await Promise.all([
    supabase.from('verb_sentences').select('id, sentence, correct_form').limit(5),
    supabase.from('vocab_sentences').select('id, sentence, correct_form').limit(5),
  ])

  const verbSentences = (verbRows as Pick<VerbSentence, 'id' | 'sentence' | 'correct_form'>[] ?? [])
  const vocabSentences = (vocabRows as Pick<VocabSentence, 'id' | 'sentence' | 'correct_form'>[] ?? [])

  // Interleave verb + vocab sentences for variety
  const verbItems: PronunciationItem[] = verbSentences.map((s) => ({
    id: s.id,
    displayText: s.sentence.replace('_____', s.correct_form),
    source: 'verb' as const,
  }))
  const vocabItems: PronunciationItem[] = vocabSentences.map((s) => ({
    id: s.id,
    displayText: s.sentence.replace('_____', s.correct_form),
    source: 'vocab' as const,
  }))

  const items: PronunciationItem[] = []
  const maxLen = Math.max(verbItems.length, vocabItems.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < verbItems.length) items.push(verbItems[i])
    if (i < vocabItems.length) items.push(vocabItems[i])
  }

  const sessionItems = items.slice(0, 10)

  if (sessionItems.length === 0) {
    redirect(ROUTES.pronunciation)
  }

  return (
    <main className="max-w-2xl mx-auto px-5 pt-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 min-h-[100dvh] flex flex-col">
      <ErrorBoundary>
        <PronunciationSession
          items={sessionItems}
          l1Language={l1Language}
          sessionUrl="/pronunciation/session"
        />
      </ErrorBoundary>
    </main>
  )
}
