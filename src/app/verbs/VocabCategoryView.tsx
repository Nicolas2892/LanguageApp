'use client'

import Link from 'next/link'
import { VOCAB_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_LEVELS } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'

export interface VocabCategoryData {
  category: VocabCategory
  itemCount: number
  accuracy: number | null  // 0–100, null if no attempts
}

interface Props {
  categories: VocabCategoryData[]
}

export function VocabCategoryView({ categories }: Props) {
  const catMap = new Map(categories.map((c) => [c.category, c]))

  return (
    <div className="space-y-3">
      {VOCAB_CATEGORIES.map((cat) => {
        const data = catMap.get(cat)
        const itemCount = data?.itemCount ?? 0
        const accuracy = data?.accuracy ?? null

        if (itemCount === 0) return null

        return (
          <Link
            key={cat}
            href={`/vocab/configure?categories=${cat}`}
            className="senda-card block space-y-2 hover:ring-1 hover:ring-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--d5-ink)' }}>
                  {CATEGORY_LABELS[cat]}
                </p>
                <p className="text-xs text-[var(--d5-muted)] mt-0.5">
                  {CATEGORY_LEVELS[cat]} · {itemCount} expresiones
                </p>
              </div>
              {accuracy !== null && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
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
            <p className="text-xs text-[var(--d5-muted)]">{CATEGORY_DESCRIPTIONS[cat]}</p>
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
      })}

      {/* CTA */}
      <Link
        href="/vocab/configure"
        className="block w-full rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
      >
        Practica Vocabulario →
      </Link>
    </div>
  )
}
