import type { WordScore } from '@/lib/azure/client'

interface Props {
  words: WordScore[]
}

export function WordScoreChips({ words }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((w, i) => {
        const score = w.accuracyScore
        const colorClass =
          score >= 80
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : score >= 50
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'

        return (
          <span
            key={`${w.word}-${i}`}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}
            title={`${w.word}: ${score}%`}
          >
            {w.word}
          </span>
        )
      })}
    </div>
  )
}
