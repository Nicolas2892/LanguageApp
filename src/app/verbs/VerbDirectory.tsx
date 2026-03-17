'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { VerbRow, type VerbMasteryState } from '@/components/verbs/VerbRow'
import { CONJUGATION_TENSES } from '@/lib/verbs/constants'

interface VerbItem {
  id: string
  infinitive: string
  english: string
  verb_group: string
  favorited: boolean
  masteryByTense: Record<string, { attempts: number; correct: number }>
}

interface Props {
  verbs: VerbItem[]
}

type VerbGroupFilter = 'todos' | 'ar' | 'er' | 'ir' | 'irregular'

const GROUP_FILTERS: { key: VerbGroupFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ar', label: '-AR' },
  { key: 'er', label: '-ER' },
  { key: 'ir', label: '-IR' },
  { key: 'irregular', label: 'Irregulares' },
]

export function VerbDirectory({ verbs }: Props) {
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<VerbGroupFilter>('todos')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const filtered = verbs
    .filter((v) => {
      if (groupFilter !== 'todos' && v.verb_group !== groupFilter) return false
      if (favoritesOnly && !v.favorited) return false
      return true
    })
    .filter((v) =>
      !query.trim() ||
      v.infinitive.toLowerCase().includes(query.toLowerCase()) ||
      v.english.toLowerCase().includes(query.toLowerCase()),
    )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${query.trim() ? 'text-primary' : 'text-muted-foreground'}`} />
        <input
          type="search"
          placeholder="Buscar Verbos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="senda-input pr-4 py-2.5 rounded-xl"
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
        {GROUP_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setGroupFilter(f.key === groupFilter ? 'todos' : f.key)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={
              groupFilter === f.key
                ? { background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', borderColor: 'var(--d5-terracotta)' }
                : { background: 'var(--d5-pill-bg)', color: 'var(--d5-pill-text)', borderColor: 'var(--d5-pill-border)' }
            }
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
          style={
            favoritesOnly
              ? { background: 'var(--d5-terracotta)', color: 'var(--d5-paper)', borderColor: 'var(--d5-terracotta)' }
              : { background: 'var(--d5-pill-bg)', color: 'var(--d5-pill-text)', borderColor: 'var(--d5-pill-border)' }
          }
        >
          Favoritos
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="senda-card text-center py-10">
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>
            No se encontraron verbos.
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            ¡Prueba con otra búsqueda!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            filtered.reduce<Record<string, VerbItem[]>>((acc, v) => {
              const letter = v.infinitive[0].toUpperCase()
              ;(acc[letter] ??= []).push(v)
              return acc
            }, {})
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, group]) => (
              <div key={letter}>
                <p className="senda-eyebrow mb-2">{letter}</p>
                <div>
                  {group.map((v, i) => {
                    const tenseEntries = CONJUGATION_TENSES.map((tense) => v.masteryByTense[tense])
                    const practiced = tenseEntries.filter((m) => m && m.attempts > 0)
                    let masteryState: VerbMasteryState = 'none'
                    if (practiced.length > 0) {
                      const allMastered = CONJUGATION_TENSES.every((tense) => {
                        const m = v.masteryByTense[tense]
                        return m && m.attempts > 0 && Math.round((m.correct / m.attempts) * 100) >= 70
                      })
                      masteryState = allMastered ? 'mastered' : 'in_progress'
                    }
                    return (
                      <VerbRow
                        key={v.id}
                        id={v.id}
                        infinitive={v.infinitive}
                        english={v.english}
                        verbGroup={v.verb_group}
                        favorited={v.favorited}
                        masteryState={masteryState}
                        isLast={i === group.length - 1}
                        style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
