'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const EXERCISE_TYPES = [
  { value: 'gap_fill',          label: 'Gap fill',           desc: 'Fill in the missing word or connector' },
  { value: 'transformation',    label: 'Transformation',     desc: 'Rewrite a sentence using a target structure' },
  { value: 'translation',       label: 'Translation',        desc: 'Translate an English sentence to Spanish' },
  { value: 'error_correction',  label: 'Error correction',   desc: 'Spot and fix the grammatical error' },
  { value: 'sentence_builder',  label: 'Sentence builder',   desc: 'Arrange jumbled words into a correct sentence' },
  { value: 'free_write',        label: 'Free write',         desc: 'Write freely using a target structure' },
]

const SESSION_SIZES = [5, 10, 15, 20, 25] as const
const DEFAULT_SIZE = 10

type SessionMode = 'srs' | 'review'

interface Module {
  id: string
  title: string
  mastered: number
  total: number
}

interface Props {
  modules: Module[]
  mistakeConceptCount: number
}

export function SessionConfig({ modules, mistakeConceptCount }: Props) {
  const router = useRouter()
  const [sessionMode, setSessionMode] = useState<SessionMode>('srs')
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [sessionSize, setSessionSize] = useState(DEFAULT_SIZE)

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  function handleStart() {
    if (sessionMode === 'review') {
      router.push('/study?mode=review')
      return
    }
    const params = new URLSearchParams()
    if (selectedModule !== 'all') params.set('module', selectedModule)
    if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','))
    if (sessionSize !== DEFAULT_SIZE) params.set('size', String(sessionSize))
    router.push(`/study?${params.toString()}`)
  }

  return (
    <div className="space-y-8">
      {/* Session mode picker — only shown when mistakes exist */}
      {mistakeConceptCount > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mode</h2>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setSessionMode('srs')}
              className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                sessionMode === 'srs'
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="font-medium">SRS review</span>
              <span className="text-muted-foreground ml-2">(due queue)</span>
            </button>
            <button
              onClick={() => setSessionMode('review')}
              className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                sessionMode === 'review'
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Review mistakes</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {mistakeConceptCount} concept{mistakeConceptCount !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* SRS-only options — hidden in review mode */}
      {sessionMode !== 'review' && (
        <>
          {/* Module picker */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Module</h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedModule('all')}
                className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                  selectedModule === 'all'
                    ? 'border-primary bg-primary/5 font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="font-medium">All modules</span>
                <span className="text-muted-foreground ml-2">(SRS due queue)</span>
              </button>
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                    selectedModule === mod.id
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={selectedModule === mod.id ? 'font-medium' : ''}>{mod.title}</span>
                    {mod.total > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {mod.mastered}/{mod.total} mastered
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Session size picker */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How many exercises?</h2>
            <div className="flex gap-2 flex-wrap">
              {SESSION_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSessionSize(size)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    sessionSize === size
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* Exercise type picker */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Exercise types</h2>
              <span className="text-xs text-muted-foreground">
                {selectedTypes.length === 0 ? 'All types' : `${selectedTypes.length} selected`}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {EXERCISE_TYPES.map((type) => {
                const active = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`text-left border rounded-xl px-4 py-3 transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-medium">{type.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                  </button>
                )
              })}
            </div>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-xs text-muted-foreground underline"
              >
                Clear selection (use all types)
              </button>
            )}
          </section>
        </>
      )}

      <Button onClick={handleStart} className="w-full rounded-full" size="lg">
        Start session →
      </Button>
    </div>
  )
}
