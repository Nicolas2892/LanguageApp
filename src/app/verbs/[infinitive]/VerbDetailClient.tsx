'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Palette } from 'lucide-react'
import { VerbFavoriteButton } from '@/components/verbs/VerbFavoriteButton'
import { AnimatedBar } from '@/components/AnimatedBar'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { TENSE_LABELS, TENSE_DESCRIPTIONS, type VerbTense } from '@/lib/verbs/constants'

const COLOUR_ENDINGS_KEY = 'verb-colour-endings'

/* ── Mood-grouped tenses ── */

interface MoodGroup {
  label: string
  tenses: VerbTense[]
}

const MOOD_GROUPS: MoodGroup[] = [
  {
    label: 'Indicativo',
    tenses: ['present_indicative', 'preterite', 'imperfect', 'future', 'conditional'],
  },
  {
    label: 'Subjuntivo',
    tenses: ['present_subjunctive', 'imperfect_subjunctive'],
  },
  {
    label: 'Imperativo',
    tenses: ['imperative_affirmative', 'imperative_negative'],
  },
]

const TENSE_SHORT_LABELS: Record<string, string> = {
  present_indicative:     'Presente',
  preterite:              'Indefinido',
  imperfect:              'Imperfecto',
  future:                 'Futuro',
  conditional:            'Condicional',
  present_subjunctive:    'Presente',
  imperfect_subjunctive:  'Imperfecto',
  imperative_affirmative: 'Afirmativo',
  imperative_negative:    'Negativo',
}

const PRONOUN_LABELS: Record<string, string> = {
  yo:        'yo',
  tu:        'tú',
  el:        'él/ella/Ud.',
  nosotros:  'nosotros/as',
  vosotros:  'vosotros/as',
  ellos:     'ellos/as',
}

const PRONOUN_ORDER = ['yo', 'tu', 'el', 'nosotros', 'vosotros', 'ellos']

interface TenseTableEntry {
  pronoun: string
  form: string
  stem: string
}

interface TenseData {
  tense: string
  rows: TenseTableEntry[]
  masteryPct: number | null
  attempts: number
}

interface Props {
  verbId: string
  infinitive: string
  english: string
  verbGroup: string
  favorited: boolean
  tenseData: TenseData[]
}

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function ColouredForm({ form, stem }: { form: string; stem: string }) {
  if (stem === '' || !stripAccents(form).startsWith(stripAccents(stem))) {
    return <span style={{ color: 'var(--d5-terracotta)', fontWeight: 600 }}>{form}</span>
  }
  const stemPart = form.substring(0, stem.length)
  const ending = form.substring(stem.length)
  return (
    <>
      <span style={{ color: 'color-mix(in oklch, var(--d5-ink) 75%, transparent)', fontWeight: 400 }}>{stemPart}</span>
      <span style={{ color: 'var(--d5-terracotta)', fontWeight: 600 }}>{ending}</span>
    </>
  )
}

export function VerbDetailClient({ verbId, infinitive, english, verbGroup, favorited, tenseData }: Props) {
  const [colourEndings, setColourEndings] = useState(true)
  const [selectedTense, setSelectedTense] = useState<VerbTense>('present_indicative')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLOUR_ENDINGS_KEY)
      if (stored !== null) setColourEndings(stored === 'true')
    } catch {
      // localStorage unavailable
    }
  }, [])

  function toggleColourEndings() {
    const next = !colourEndings
    setColourEndings(next)
    try {
      localStorage.setItem(COLOUR_ENDINGS_KEY, String(next))
    } catch {
      // ignore
    }
  }

  const activeData = tenseData.find((d) => d.tense === selectedTense)
  const rows = activeData?.rows ?? []
  const masteryPct = activeData?.masteryPct ?? null
  const attempts = activeData?.attempts ?? 0

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/verbs"
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Back to verbs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: 28, lineHeight: 1.15, color: 'var(--d5-terracotta)' }}
            >
              {infinitive}
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(184,170,153,0.25)', color: 'var(--d5-warm)' }}>
              -{verbGroup}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--d5-warm)' }}>{english}</p>
        </div>
        <VerbFavoriteButton verbId={verbId} initialFavorited={favorited} size="md" />
      </div>

      <div style={{ margin: '-4px 0' }}>
        <WindingPathSeparator />
      </div>

      {/* Mood-grouped tense selector */}
      <div role="tablist" aria-label="Tense selector" className="flex flex-col gap-3">
        {MOOD_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="senda-eyebrow"
              style={{ marginBottom: 8, color: 'var(--d5-muted)', fontSize: '0.5625rem' }}
            >
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.tenses.map((tense) => {
                const active = tense === selectedTense
                return (
                  <button
                    key={tense}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedTense(tense)}
                    className="senda-focus-ring"
                    style={{
                      borderRadius: 99, cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                      whiteSpace: 'nowrap',
                      minHeight: 44, display: 'flex', alignItems: 'center',
                      padding: '0 16px', fontSize: 12,
                      fontWeight: active ? 700 : 400,
                      transition: 'background 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out',
                      background: active ? 'var(--d5-terracotta)' : 'transparent',
                      color: active ? 'var(--d5-paper)' : 'var(--d5-warm)',
                      border: active ? '1.5px solid transparent' : '1.5px solid var(--d5-pill-border)',
                    }}
                  >
                    {TENSE_SHORT_LABELS[tense]}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tense header — label + description + colour toggle */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="senda-eyebrow" style={{ marginBottom: 4 }}>{TENSE_LABELS[selectedTense]}</p>
          <p className="text-[11px]" style={{ color: 'var(--d5-muted)' }}>{TENSE_DESCRIPTIONS[selectedTense]}</p>
        </div>
        <button
          onClick={toggleColourEndings}
          aria-pressed={colourEndings}
          aria-label="Toggle colour endings"
          title={colourEndings ? 'Hide coloured endings' : 'Show coloured endings'}
          className="senda-focus-ring"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, marginTop: -4, marginRight: -8, borderRadius: 8,
            color: colourEndings ? 'var(--d5-terracotta)' : 'var(--d5-muted)',
            transition: 'color 200ms ease-out',
          }}
        >
          <Palette className="h-4 w-4" />
        </button>
      </div>

      {/* Conjugation table */}
      {rows.length > 0 ? (
        <div className="senda-card-sm" style={{ padding: '4px 14px' }}>
          <table className="w-full" role="table">
            <tbody>
              {PRONOUN_ORDER.map((pronoun, idx) => {
                const row = rows.find((r) => r.pronoun === pronoun)
                return (
                  <tr
                    key={pronoun}
                    style={{
                      borderBottom: idx < PRONOUN_ORDER.length - 1 ? '1px solid rgba(184,170,153,0.15)' : undefined,
                      background: idx % 2 === 1 ? 'rgba(140,106,63,0.03)' : undefined,
                    }}
                  >
                    <td
                      style={{
                        padding: '8px 2px', width: 82, flexShrink: 0,
                        fontSize: 11, color: 'var(--d5-muted)',
                        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                      }}
                    >
                      {PRONOUN_LABELS[pronoun] ?? pronoun}
                    </td>
                    <td
                      style={{
                        padding: '8px 2px',
                        fontFamily: 'var(--font-lora), serif', fontStyle: 'italic',
                        fontSize: 14,
                      }}
                    >
                      {row && row.form !== ''
                        ? colourEndings
                          ? <ColouredForm form={row.form} stem={row.stem} />
                          : <span style={{ color: 'var(--d5-ink)' }}>{row.form}</span>
                        : <span style={{ color: 'var(--d5-muted)', fontSize: 12, fontStyle: 'italic' }}>—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: 14, color: 'var(--d5-warm)', lineHeight: 1.5, padding: '8px 0' }}>
          Sin datos aún — practica para ver tu progreso.
        </p>
      )}

      {/* Mastery stats — below table */}
      {masteryPct !== null && (
        <div style={{ padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 10, color: 'var(--d5-warm)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
              {attempts} intentos
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--d5-ink)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
              {masteryPct}%
            </p>
          </div>
          <div className="relative overflow-hidden" style={{ height: 5, borderRadius: 99, background: 'color-mix(in oklch, var(--d5-muted) 25%, transparent)' }} data-testid="mastery-bar">
            <AnimatedBar
              pct={masteryPct}
              className={masteryPct >= 70 ? '' : ''}
              style={{
                background: masteryPct >= 70 ? 'var(--d5-muted)' : 'var(--d5-terracotta)',
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/verbs/configure?verb=${infinitive}`}
        className="senda-cta w-full"
      >
        Practicar este verbo →
      </Link>
    </main>
  )
}
