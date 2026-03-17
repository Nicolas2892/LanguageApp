'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Palette, Bot } from 'lucide-react'
import { VerbFavoriteButton } from '@/components/verbs/VerbFavoriteButton'
import { AnimatedBar } from '@/components/AnimatedBar'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
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
      <span style={{ color: 'color-mix(in oklch, var(--d5-heading) 75%, transparent)', fontWeight: 400 }}>{stemPart}</span>
      <span style={{ color: 'var(--d5-terracotta)', fontWeight: 600 }}>{ending}</span>
    </>
  )
}

export function VerbDetailClient({ verbId, infinitive, english, verbGroup, favorited, tenseData }: Props) {
  const [colourEndings, setColourEndings] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const stored = localStorage.getItem(COLOUR_ENDINGS_KEY)
      return stored !== null ? stored === 'true' : true
    } catch {
      return true
    }
  })
  const [selectedTense, setSelectedTense] = useState<VerbTense>('present_indicative')

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
    <main className="relative overflow-hidden max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 flex flex-col gap-5">
      <BackgroundMagicS opacity={0.04} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/verbs"
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Volver a verbos"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="senda-heading"
              style={{ fontSize: '1.75rem', color: 'var(--d5-terracotta)' }}
            >
              {infinitive}
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--d5-surface-tint)', color: 'var(--d5-body)' }}>
              -{verbGroup}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--d5-body)' }}>{english}</p>
          <Link
            href="/tutor"
            className="inline-flex items-center gap-1 text-xs text-[var(--d5-warm)] hover:text-primary transition-colors mt-0.5"
          >
            <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
            Consultar tutor →
          </Link>
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
              style={{ marginBottom: '0.5rem', color: 'var(--d5-subtle)', fontSize: '0.5625rem' }}
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
                      minHeight: '2.75rem', display: 'flex', alignItems: 'center',
                      padding: '0 16px', fontSize: 12,
                      fontWeight: active ? 700 : 400,
                      transition: 'background 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out',
                      background: active ? 'var(--d5-terracotta)' : 'transparent',
                      color: active ? 'var(--d5-paper)' : 'var(--d5-body)',
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
          <p className="senda-eyebrow" style={{ marginBottom: '0.25rem' }}>{TENSE_LABELS[selectedTense]}</p>
          <p className="text-[11px]" style={{ color: 'var(--d5-subtle)' }}>{TENSE_DESCRIPTIONS[selectedTense]}</p>
        </div>
        <button
          onClick={toggleColourEndings}
          aria-pressed={colourEndings}
          aria-label="Alternar terminaciones coloreadas"
          title={colourEndings ? 'Ocultar terminaciones coloreadas' : 'Mostrar terminaciones coloreadas'}
          className="senda-focus-ring"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.5rem', marginTop: '-0.25rem', marginRight: '-0.5rem', borderRadius: '0.5rem',
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
                      borderBottom: idx < PRONOUN_ORDER.length - 1 ? '1px solid var(--d5-divider)' : undefined,
                      background: idx % 2 === 1 ? 'var(--d5-surface-tint)' : undefined,
                    }}
                  >
                    <td
                      style={{
                        padding: '0.5rem 0.125rem', width: '5.125rem', flexShrink: 0,
                        fontSize: '0.6875rem', color: 'var(--d5-subtle)',
                        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                      }}
                    >
                      {PRONOUN_LABELS[pronoun] ?? pronoun}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem 0.125rem',
                        fontFamily: 'var(--font-lora), serif', fontStyle: 'italic',
                        fontSize: '0.875rem',
                      }}
                    >
                      {row && row.form !== ''
                        ? colourEndings
                          ? <ColouredForm form={row.form} stem={row.stem} />
                          : <span style={{ color: 'var(--d5-heading)' }}>{row.form}</span>
                        : <span style={{ color: 'var(--d5-subtle)', fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-lora), serif', fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--d5-body)', lineHeight: 1.5, padding: '0.5rem 0' }}>
          Sin datos aún — practica para ver tu progreso.
        </p>
      )}

      {/* Mastery stats — below table */}
      {masteryPct !== null && (
        <div style={{ padding: '0 0.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.625rem', color: 'var(--d5-body)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
              {attempts} intentos
            </p>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--d5-heading)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
              {masteryPct}%
            </p>
          </div>
          <div className="relative overflow-hidden" style={{ height: 5, borderRadius: 99, background: 'color-mix(in oklch, var(--d5-subtle) 50%, transparent)' }} data-testid="mastery-bar">
            <AnimatedBar
              pct={masteryPct}
              className={masteryPct >= 70 ? '' : ''}
              style={{
                background: masteryPct >= 70 ? 'var(--d5-subtle)' : 'var(--d5-terracotta)',
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/verbs/session?tenses=present_indicative,preterite,imperfect,future,conditional,present_subjunctive,imperfect_subjunctive,imperative_affirmative,imperative_negative&verbSet=single&verb=${infinitive}&length=10`}
        className="senda-cta w-full"
      >
        Practica este verbo →
      </Link>
    </main>
  )
}
