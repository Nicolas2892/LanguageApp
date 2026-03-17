'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'

interface Props {
  favoriteCount: number
  singleVerb: string | null   // pre-selected verb from ?verb= param
}

const INDICATIVE_TENSES = ['present_indicative', 'preterite', 'imperfect', 'future', 'conditional'] as const
const SUBJUNCTIVE_TENSES = ['present_subjunctive', 'imperfect_subjunctive'] as const
const IMPERATIVE_TENSES = ['imperative_affirmative', 'imperative_negative'] as const
const VOCABULARY_TENSES = ['infinitive'] as const
const LENGTHS = [10, 20, 30] as const

type VerbSet = 'favorites' | 'top25' | 'top50' | 'top100' | 'top250' | 'irregular' | 'single'

// Shared eyebrow style — uses adaptive --d5-eyebrow token
const EYEBROW: React.CSSProperties = {
  fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--d5-eyebrow)',
  marginBottom: '0.5rem',
  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
}

const pillBase: React.CSSProperties = {
  borderRadius: 99, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
  whiteSpace: 'nowrap', flexShrink: 0,
  minHeight: '2.75rem', display: 'flex', alignItems: 'center',
  transition: 'background 200ms ease-out, color 200ms ease-out',
}

const VERB_SET_OPTIONS: Array<{ id: VerbSet; label: string; requiresFavorites?: boolean; requiresSingle?: boolean }> = [
  { id: 'favorites', label: 'Favoritos', requiresFavorites: true },
  { id: 'top25',  label: 'Top 25' },
  { id: 'top50',  label: 'Top 50' },
  { id: 'top100', label: 'Top 100' },
  { id: 'top250', label: 'Top 250' },
  { id: 'irregular', label: 'Irregulares' },
  { id: 'single', label: '', requiresSingle: true },
]

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

  // Infinitive-only mode disables hint toggle (not relevant)
  const onlyInfinitive = selectedTenses.size === 1 && selectedTenses.has('infinitive')

  // Build visible verb set options
  const visibleOptions = VERB_SET_OPTIONS.filter((opt) => {
    if (opt.requiresFavorites && favoriteCount === 0) return false
    if (opt.requiresSingle && !singleVerb) return false
    return true
  })

  return (
    <div>
      {/* ── Tenses ─────────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>Tiempos verbales</p>

        <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--d5-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Indicativo
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {INDICATIVE_TENSES.map((tense) => (
            <TenseChip
              key={tense}
              label={TENSE_LABELS[tense]}
              selected={selectedTenses.has(tense)}
              onToggle={() => toggleTense(tense)}
            />
          ))}
        </div>

        <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--d5-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Subjuntivo
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {SUBJUNCTIVE_TENSES.map((tense) => (
            <TenseChip
              key={tense}
              label={TENSE_LABELS[tense]}
              selected={selectedTenses.has(tense)}
              onToggle={() => toggleTense(tense)}
            />
          ))}
        </div>

        <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--d5-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Imperativo
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {IMPERATIVE_TENSES.map((tense) => (
            <TenseChip
              key={tense}
              label={TENSE_LABELS[tense]}
              selected={selectedTenses.has(tense)}
              onToggle={() => toggleTense(tense)}
            />
          ))}
        </div>

        <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--d5-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Vocabulario
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {VOCABULARY_TENSES.map((tense) => (
            <TenseChip
              key={tense}
              label={TENSE_LABELS[tense]}
              selected={selectedTenses.has(tense)}
              onToggle={() => toggleTense(tense)}
            />
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* ── Verb set ───────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>Verbos</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {visibleOptions.map((opt) => {
            const active = verbSet === opt.id
            const displayLabel = opt.id === 'favorites'
              ? `${opt.label} (${favoriteCount})`
              : opt.id === 'single'
                ? singleVerb ?? ''
                : opt.label
            return (
              <button
                key={opt.id}
                onClick={() => setVerbSet(opt.id)}
                className="senda-focus-ring"
                style={{
                  ...pillBase,
                  padding: '0 16px',
                  background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                  fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                }}
              >
                {displayLabel}
              </button>
            )
          })}
        </div>
      </div>

      <WindingPathSeparator />

      {/* ── Length ──────────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>¿Cuántas frases?</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {LENGTHS.map((l) => {
            const active = length === l
            return (
              <button
                key={l}
                onClick={() => setLength(l)}
                className="senda-focus-ring"
                style={{
                  ...pillBase,
                  padding: '0 1rem',
                  background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  color: active ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
                  fontSize: '0.75rem', fontWeight: active ? 700 : 500,
                }}
              >
                {l}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Hint toggle ────────────────────────────────────────────── */}
      <div className="px-4 mt-4">
        <label className={`flex items-center gap-3 ${onlyInfinitive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={showHint && !onlyInfinitive}
            onChange={(e) => setShowHint(e.target.checked)}
            disabled={onlyInfinitive}
            className="h-4 w-4 rounded accent-primary"
          />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--d5-heading)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
            Mostrar pista del infinitivo
          </span>
        </label>
        <p style={{ fontSize: '0.625rem', color: 'var(--d5-muted)', marginTop: '0.25rem', marginLeft: '1.75rem', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
          Muestra el verbo entre corchetes junto al espacio en blanco.
        </p>
      </div>

      <WindingPathSeparator />

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-5">
        <button
          onClick={handleStart}
          className="senda-focus-ring"
          style={{
            background: 'var(--d5-terracotta)', color: 'var(--d5-paper)',
            border: 'none', borderRadius: 99, padding: '0.75rem 0', width: '100%',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            transition: 'opacity 200ms ease-out',
          }}
        >
          Empezar Práctica →
        </button>
      </div>
    </div>
  )
}

function TenseChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="senda-focus-ring"
      style={{
        borderRadius: 99, border: 'none', cursor: 'pointer',
        padding: '0 16px', minHeight: 44,
        display: 'flex', alignItems: 'center',
        fontSize: 12, fontWeight: selected ? 700 : 500,
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        background: selected ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
        color: selected ? 'var(--d5-paper)' : 'var(--d5-pill-text)',
        transition: 'background 200ms ease-out, color 200ms ease-out',
      }}
    >
      {label}
    </button>
  )
}
