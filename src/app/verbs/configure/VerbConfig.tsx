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
const LENGTHS = [10, 20, 30] as const

type VerbSet = 'favorites' | 'top25' | 'top50' | 'top100' | 'single'

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

const VERB_SET_OPTIONS: Array<{ id: VerbSet; title: string; subtitle: string; requiresFavorites?: boolean; requiresSingle?: boolean }> = [
  { id: 'favorites', title: 'Mis Favoritos', subtitle: '', requiresFavorites: true },
  { id: 'top25',  title: 'Top 25',  subtitle: 'más comunes' },
  { id: 'top50',  title: 'Top 50',  subtitle: 'más comunes' },
  { id: 'top100', title: 'Top 100', subtitle: 'más comunes' },
  { id: 'single', title: 'Solo', subtitle: '', requiresSingle: true },
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

      <WindingPathSeparator />

      {/* ── Verb set ───────────────────────────────────────────────── */}
      <div className="px-4">
        <p style={EYEBROW}>Verbos</p>
        <div className="flex flex-col gap-2">
          {visibleOptions.map((opt) => {
            const active = verbSet === opt.id
            const displayTitle = opt.id === 'favorites'
              ? `${opt.title} (${favoriteCount})`
              : opt.id === 'single'
                ? `${opt.title}: ${singleVerb}`
                : opt.title
            return (
              <button
                key={opt.id}
                onClick={() => setVerbSet(opt.id)}
                className="senda-focus-ring"
                style={{
                  position: 'relative', textAlign: 'left',
                  borderRadius: '0.75rem', padding: '12px 16px', border: 'none', cursor: 'pointer',
                  background: active ? 'var(--d5-terracotta)' : 'var(--d5-pill-bg)',
                  transition: 'background 200ms ease-out, color 200ms ease-out',
                }}
              >
                {active && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <svg viewBox="0 0 18 8" width={13} height={6}>
                      <path
                        d="M 1 5 C 4 2, 7 6, 11 4 C 14 2, 17 4, 17 4"
                        stroke="var(--d5-paper)" strokeWidth={2} strokeLinecap="round" fill="none"
                      />
                    </svg>
                  </div>
                )}
                <div style={{
                  fontFamily: 'var(--font-lora), serif', fontWeight: 600, fontStyle: 'italic', fontSize: 14,
                  color: active ? 'var(--d5-paper)' : 'var(--d5-heading)',
                  marginBottom: opt.subtitle ? '0.125rem' : 0,
                }}>
                  {displayTitle}
                </div>
                {opt.subtitle && (
                  <div style={{
                    fontSize: '0.625rem',
                    color: active ? 'var(--d5-paper-75)' : 'var(--d5-muted)',
                    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                  }}>
                    {opt.subtitle}
                  </div>
                )}
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
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => setShowHint(e.target.checked)}
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
