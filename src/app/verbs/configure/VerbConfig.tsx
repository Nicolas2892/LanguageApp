'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import { Button } from '@/components/ui/button'

interface Props {
  favoriteCount: number
  singleVerb: string | null   // pre-selected verb from ?verb= param
}

const INDICATIVE_TENSES = ['present_indicative', 'preterite', 'imperfect', 'future', 'conditional'] as const
const SUBJUNCTIVE_TENSES = ['present_subjunctive', 'imperfect_subjunctive'] as const
const IMPERATIVE_TENSES = ['imperative_affirmative', 'imperative_negative'] as const
const LENGTHS = [10, 20, 30] as const

type VerbSet = 'favorites' | 'top25' | 'top50' | 'top100' | 'single'

export function VerbConfig({ favoriteCount, singleVerb }: Props) {
  const router = useRouter()

  const [selectedTenses, setSelectedTenses] = useState<Set<string>>(
    new Set(['present_indicative'])
  )
  const [verbSet, setVerbSet] = useState<VerbSet>(singleVerb ? 'single' : favoriteCount > 0 ? 'favorites' : 'top25')
  const [length, setLength] = useState<10 | 20 | 30>(10)
  const [showHint, setShowHint] = useState(true)

  function toggleTense(tense: string) {
    setSelectedTenses((prev) => {
      const next = new Set(prev)
      if (next.has(tense)) {
        if (next.size === 1) return prev  // must keep at least one
        next.delete(tense)
      } else {
        next.add(tense)
      }
      return next
    })
  }

  function handleStart() {
    const params = new URLSearchParams()
    params.set('tenses', Array.from(selectedTenses).join(','))
    params.set('verbSet', verbSet)
    if (verbSet === 'single' && singleVerb) params.set('verb', singleVerb)
    params.set('length', String(length))
    if (showHint) params.set('hint', '1')
    router.push(`/verbs/session?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Tenses */}
      <section className="bg-card rounded-xl border p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tenses</p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Indicative</p>
          <div className="flex flex-wrap gap-2">
            {INDICATIVE_TENSES.map((tense) => (
              <TenseChip
                key={tense}
                label={TENSE_LABELS[tense]}
                selected={selectedTenses.has(tense)}
                onToggle={() => toggleTense(tense)}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground pt-1">Subjunctive</p>
          <div className="flex flex-wrap gap-2">
            {SUBJUNCTIVE_TENSES.map((tense) => (
              <TenseChip
                key={tense}
                label={TENSE_LABELS[tense]}
                selected={selectedTenses.has(tense)}
                onToggle={() => toggleTense(tense)}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground pt-1">Imperative</p>
          <div className="flex flex-wrap gap-2">
            {IMPERATIVE_TENSES.map((tense) => (
              <TenseChip
                key={tense}
                label={TENSE_LABELS[tense]}
                selected={selectedTenses.has(tense)}
                onToggle={() => toggleTense(tense)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Verb set */}
      <section className="bg-card rounded-xl border p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Verbs</p>
        <div className="space-y-2">
          {favoriteCount > 0 && (
            <RadioOption
              selected={verbSet === 'favorites'}
              onSelect={() => setVerbSet('favorites')}
              label={`My Favorites (${favoriteCount})`}
            />
          )}
          <RadioOption selected={verbSet === 'top25'}  onSelect={() => setVerbSet('top25')}  label="Top 25 most common" />
          <RadioOption selected={verbSet === 'top50'}  onSelect={() => setVerbSet('top50')}  label="Top 50 most common" />
          <RadioOption selected={verbSet === 'top100'} onSelect={() => setVerbSet('top100')} label="Top 100 most common" />
          {singleVerb && (
            <RadioOption
              selected={verbSet === 'single'}
              onSelect={() => setVerbSet('single')}
              label={`Only: ${singleVerb}`}
            />
          )}
        </div>
      </section>

      {/* Session length */}
      <section className="bg-card rounded-xl border p-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Length</p>
        <div className="flex gap-3">
          {LENGTHS.map((l) => (
            <Button
              key={l}
              onClick={() => setLength(l)}
              variant={length === l ? 'default' : 'outline'}
              className="flex-1 rounded-full"
            >
              {l}
            </Button>
          ))}
        </div>
      </section>

      {/* Hint toggle */}
      <section className="bg-card rounded-xl border p-5 shadow-sm">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => setShowHint(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-sm font-medium">Show infinitive hint</span>
        </label>
        <p className="text-xs text-muted-foreground mt-1 ml-7">
          Displays the verb in brackets next to the blank as a reminder.
        </p>
      </section>

      {/* Start button */}
      <Button onClick={handleStart} className="w-full rounded-full" size="lg">
        Start Practice
      </Button>
    </div>
  )
}

function TenseChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        selected
          ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border-green-300 dark:border-green-800'
          : 'bg-background hover:bg-muted border-border text-muted-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function RadioOption({ selected, onSelect, label }: { selected: boolean; onSelect: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <span
        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-primary' : 'border-muted-foreground/40'
        }`}
        onClick={onSelect}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  )
}
