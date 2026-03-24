import type { VocabCategory } from '@/lib/vocab/constants'

export const CHIP_LABELS: Record<VocabCategory, string> = {
  discourse_markers: 'Discurso',
  fixed_phrases:     'Fijas',
  collocations:      'Coloc.',
  register_phrases:  'Formal',
  idiomatic:         'Idiom.',
  prepositional:     'Prep.',
  adverbial:         'Adverb.',
  pragmatic:         'Pragm.',
}

interface Props {
  category: string | null | undefined
}

export function VocabCategoryChip({ category }: Props) {
  if (!category) return null
  const label = CHIP_LABELS[category as VocabCategory]
  if (!label) return null
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-[rgba(140,106,63,0.10)] dark:bg-[rgba(140,106,63,0.20)] text-[#8C6A3F] dark:text-[#C4AD6A] border-[rgba(140,106,63,0.25)] dark:border-[rgba(140,106,63,0.35)]">
      {label}
    </span>
  )
}
