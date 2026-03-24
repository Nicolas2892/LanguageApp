'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { VocabRow, type VocabMasteryState } from '@/components/vocab/VocabRow'
import { CHIP_LABELS } from '@/components/vocab/VocabCategoryChip'
import { VOCAB_CATEGORIES } from '@/lib/vocab/constants'
import type { VocabCategory } from '@/lib/vocab/constants'

export interface VocabListItem {
  expression: string
  english: string
  category: string
  masteryState: VocabMasteryState
}

interface Props {
  items: VocabListItem[]
}

export function VocabDirectory({ items }: Props) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VocabCategory | 'todos'>('todos')

  const filtered = items
    .filter((v) => {
      if (categoryFilter !== 'todos' && v.category !== categoryFilter) return false
      return true
    })
    .filter((v) =>
      !query.trim() ||
      v.expression.toLowerCase().includes(query.toLowerCase()) ||
      v.english.toLowerCase().includes(query.toLowerCase()),
    )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${query.trim() ? 'text-primary' : 'text-muted-foreground'}`} />
        <input
          type="search"
          placeholder="Buscar Vocabulario..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="senda-input pr-4 py-2.5 rounded-xl"
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('todos')}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
          style={
            categoryFilter === 'todos'
              ? { background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', borderColor: 'var(--d5-terracotta)' }
              : { background: 'var(--d5-pill-bg)', color: 'var(--d5-pill-text)', borderColor: 'var(--d5-pill-border)' }
          }
        >
          Todos
        </button>
        {VOCAB_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === categoryFilter ? 'todos' : cat)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={
              categoryFilter === cat
                ? { background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', borderColor: 'var(--d5-terracotta)' }
                : { background: 'var(--d5-pill-bg)', color: 'var(--d5-pill-text)', borderColor: 'var(--d5-pill-border)' }
            }
          >
            {CHIP_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="senda-card text-center py-10">
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
            No se encontraron expresiones.
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            ¡Prueba con otra búsqueda!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            filtered.reduce<Record<string, VocabListItem[]>>((acc, v) => {
              const letter = v.expression[0].toUpperCase()
              ;(acc[letter] ??= []).push(v)
              return acc
            }, {})
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, group]) => (
              <div key={letter}>
                <p className="senda-eyebrow mb-2">{letter}</p>
                <div>
                  {group.map((v, i) => (
                    <VocabRow
                      key={v.expression}
                      expression={v.expression}
                      english={v.english}
                      category={v.category}
                      masteryState={v.masteryState}
                      isLast={i === group.length - 1}
                      style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
