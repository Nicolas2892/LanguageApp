import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import { VerbDirectory } from './VerbDirectory'
import { VerbsVocabToggle } from './VerbsVocabToggle'
import { VocabCategoryView } from './VocabCategoryView'
import type { VocabCategoryData } from './VocabCategoryView'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { Verb, VerbProgress, UserVerbFavorite, VocabItem, VocabProgress } from '@/lib/supabase/types'
import { VOCAB_CATEGORIES } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'

export default async function VerbsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  // Fetch all verbs, user favorites, verb progress, vocab items, vocab progress in parallel
  const [
    { data: verbRows },
    { data: favoriteRows },
    { data: progressRows },
    { data: vocabItemRows },
    { data: vocabProgressRows },
  ] = await Promise.all([
    supabase.from('verbs').select('*').order('infinitive'),
    supabase.from('user_verb_favorites').select('verb_id').eq('user_id', user.id),
    supabase.from('verb_progress').select('verb_id, tense, attempt_count, correct_count').eq('user_id', user.id),
    supabase.from('vocab_items').select('id, category').order('frequency_rank'),
    supabase.from('vocab_progress').select('vocab_id, attempt_count, correct_count').eq('user_id', user.id),
  ])

  // ── Verb data ──────────────────────────────────────────────────────
  const verbs = (verbRows as Verb[] ?? [])
  const favoriteSet = new Set((favoriteRows as Pick<UserVerbFavorite, 'verb_id'>[] ?? []).map((f) => f.verb_id))

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

  // ── Vocab data ─────────────────────────────────────────────────────
  const vocabItems = (vocabItemRows as Pick<VocabItem, 'id' | 'category'>[] ?? [])
  const vocabProgress = (vocabProgressRows as Pick<VocabProgress, 'vocab_id' | 'attempt_count' | 'correct_count'>[] ?? [])

  // Build per-item progress map
  const vocabProgressMap = new Map(vocabProgress.map((p) => [p.vocab_id, p]))

  // Build per-category stats
  const categoryCounts = new Map<VocabCategory, number>()
  const categoryAttempts = new Map<VocabCategory, { attempts: number; correct: number }>()

  for (const item of vocabItems) {
    const cat = item.category as VocabCategory
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)

    const progress = vocabProgressMap.get(item.id)
    if (progress && progress.attempt_count > 0) {
      const existing = categoryAttempts.get(cat) ?? { attempts: 0, correct: 0 }
      existing.attempts += progress.attempt_count
      existing.correct += progress.correct_count
      categoryAttempts.set(cat, existing)
    }
  }

  const vocabCategories: VocabCategoryData[] = VOCAB_CATEGORIES.map((cat) => {
    const attempts = categoryAttempts.get(cat)
    return {
      category: cat,
      itemCount: categoryCounts.get(cat) ?? 0,
      accuracy: attempts ? Math.round((attempts.correct / attempts.attempts) * 100) : null,
    }
  })

  const totalVocabItems = vocabItems.length

  return (
    <main className="relative overflow-hidden max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:pb-10 animate-page-in">
      <BackgroundMagicS />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="senda-heading text-2xl">Verbos y Vocabulario</h1>
          <p className="senda-eyebrow mt-2">
            {verbs.length} verbos · {totalVocabItems} expresiones
          </p>
        </div>
      </div>

      <VerbsVocabToggle
        verbContent={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {practicados > 0 && (
                  <p className="text-xs" style={{ color: 'var(--d5-body)' }}>
                    {practicados} practicados · {dominados} dominados
                  </p>
                )}
              </div>
              <Link
                href="/verbs/configure"
                className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Practica →
              </Link>
            </div>
            <VerbDirectory verbs={verbItems} />
          </div>
        }
        vocabContent={
          <VocabCategoryView categories={vocabCategories} />
        }
      />
    </main>
  )
}
