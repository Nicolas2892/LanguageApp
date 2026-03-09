'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { VerbCard } from '@/components/verbs/VerbCard'
import { TENSES } from '@/lib/verbs/constants'

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

export function VerbDirectory({ verbs }: Props) {
  const [query, setQuery] = useState('')
  const [irregularOnly, setIrregularOnly] = useState(false)

  const filtered = verbs
    .filter((v) => !irregularOnly || v.verb_group === 'irregular')
    .filter((v) =>
      !query.trim() ||
      v.infinitive.toLowerCase().includes(query.toLowerCase()) ||
      v.english.toLowerCase().includes(query.toLowerCase()),
    )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search verbs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setIrregularOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            irregularOnly
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-background border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Irregular only
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">No verbs match your search.</p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{letter}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.map((v) => {
                    const masteryDots = TENSES.map((tense) => {
                      const m = v.masteryByTense[tense]
                      const pct = m && m.attempts > 0 ? Math.round((m.correct / m.attempts) * 100) : 0
                      return { tense, pct }
                    })
                    return (
                      <VerbCard
                        key={v.id}
                        id={v.id}
                        infinitive={v.infinitive}
                        english={v.english}
                        verbGroup={v.verb_group}
                        favorited={v.favorited}
                        masteryDots={masteryDots}
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
