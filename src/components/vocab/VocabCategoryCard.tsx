'use client'

import Link from 'next/link'
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_LEVELS } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'

interface Props {
  category: VocabCategory
  itemCount: number
  accuracy: number | null  // 0–100, null if no attempts
}

export function VocabCategoryCard({ category, itemCount, accuracy }: Props) {
  const label = CATEGORY_LABELS[category]
  const description = CATEGORY_DESCRIPTIONS[category]
  const levelRange = CATEGORY_LEVELS[category]

  return (
    <Link
      href={`/vocab/configure?categories=${category}`}
      className="senda-card block space-y-2 hover:ring-1 hover:ring-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--d5-ink)' }}>
            {label}
          </p>
          <p className="text-xs text-[var(--d5-muted)] mt-0.5">
            {levelRange} · {itemCount} expresiones
          </p>
        </div>
        {accuracy !== null && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              accuracy >= 80
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : accuracy >= 50
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {accuracy}%
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--d5-muted)]">{description}</p>
      {accuracy !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(accuracy, 100)}%` }}
          />
        </div>
      )}
    </Link>
  )
}
