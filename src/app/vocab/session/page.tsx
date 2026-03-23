import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VocabSession } from './VocabSession'
import type { VocabSessionItem } from '@/lib/vocab/types'
import type { VocabItem, VocabSentence } from '@/lib/supabase/types'
import { VOCAB_CATEGORIES } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'

interface Props {
  searchParams: Promise<{
    categories?: string
    levels?: string
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

export default async function VocabSessionPage({ searchParams }: Props) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Parse config from query params
  const selectedCategories = (params.categories ?? 'discourse_markers')
    .split(',')
    .filter((c) => (VOCAB_CATEGORIES as readonly string[]).includes(c)) as VocabCategory[]

  if (selectedCategories.length === 0) redirect('/vocab/configure')

  const selectedLevels = params.levels
    ? params.levels.split(',').filter((l) => ['B1', 'B2', 'C1'].includes(l))
    : []

  const sessionLength = Math.min(30, Math.max(1, parseInt(params.length ?? '10', 10) || 10))
  const showHint = params.hint === '1'

  // Fetch vocab items matching categories + levels
  let itemQuery = supabase
    .from('vocab_items')
    .select('id, expression, english, category, level')
    .in('category', selectedCategories)

  if (selectedLevels.length > 0) {
    itemQuery = itemQuery.in('level', selectedLevels)
  }

  const { data: itemRows, error: itemErr } = await itemQuery
  if (itemErr) {
    console.error('Vocab items query failed:', itemErr)
    throw new Error(`Failed to load vocab items: ${itemErr.message}`)
  }

  const items = (itemRows as Pick<VocabItem, 'id' | 'expression' | 'english' | 'category' | 'level'>[] ?? [])
  if (items.length === 0) redirect('/vocab/configure')

  const itemIds = items.map((i) => i.id)

  // Fetch sentences for these items
  const { data: sentenceRows, error: sentenceErr } = await supabase
    .from('vocab_sentences')
    .select('id, vocab_id, sentence, correct_form, answer_variants, english, hint')
    .in('vocab_id', itemIds)

  if (sentenceErr) {
    console.error('Vocab sentences query failed:', sentenceErr)
    throw new Error(`Failed to load vocab sentences: ${sentenceErr.message}`)
  }

  const sentences = (sentenceRows as Pick<VocabSentence, 'id' | 'vocab_id' | 'sentence' | 'correct_form' | 'answer_variants' | 'english' | 'hint'>[] ?? [])

  // Build item lookup
  const itemMap = new Map(items.map((i) => [i.id, i]))

  // Build session items
  const allSessionItems: VocabSessionItem[] = sentences.map((s) => {
    const item = itemMap.get(s.vocab_id)
    return {
      vocabId:        s.vocab_id,
      expression:     item?.expression ?? '',
      category:       (item?.category ?? 'discourse_markers') as VocabCategory,
      sentence:       s.sentence,
      correctForm:    s.correct_form,
      answerVariants: s.answer_variants,
      english:        s.english,
      hint:           s.hint,
    }
  })

  if (allSessionItems.length === 0) redirect('/vocab/configure')

  // Shuffle and take up to sessionLength
  const sessionItems = shuffle(allSessionItems).slice(0, sessionLength)

  // Build "practice again" URL
  const sessionUrl = `/vocab/session?${new URLSearchParams({
    categories: selectedCategories.join(','),
    ...(selectedLevels.length > 0 ? { levels: selectedLevels.join(',') } : {}),
    length:     String(sessionLength),
    ...(showHint ? { hint: '1' } : {}),
  }).toString()}`

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      <VocabSession items={sessionItems} showHint={showHint} sessionUrl={sessionUrl} />
    </main>
  )
}
