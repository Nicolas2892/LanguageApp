'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Palette } from 'lucide-react'
import { VerbFavoriteButton } from '@/components/verbs/VerbFavoriteButton'
import { AnimatedBar } from '@/components/AnimatedBar'
import { TENSES, TENSE_LABELS, TENSE_DESCRIPTIONS } from '@/lib/verbs/constants'

const COLOUR_ENDINGS_KEY = 'verb-colour-endings'

const PRONOUN_LABELS: Record<string, string> = {
  yo:        'yo',
  tu:        'tú',
  el:        'él/ella',
  nosotros:  'nosotros',
  vosotros:  'vosotros',
  ellos:     'ellos/ellas',
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
  // Colour the whole form if fully irregular or if stem doesn't match
  // (accent-normalised comparison handles nosotros imperfecto: hablábamos vs stem "habl")
  if (stem === '' || !stripAccents(form).startsWith(stripAccents(stem))) {
    return <span className="text-primary font-semibold">{form}</span>
  }
  const stemPart = form.substring(0, stem.length)
  const ending = form.substring(stem.length)
  return (
    <>
      <span className="text-muted-foreground">{stemPart}</span>
      <span className="text-primary font-semibold">{ending}</span>
    </>
  )
}

export function VerbDetailClient({ verbId, infinitive, english, verbGroup, favorited, tenseData }: Props) {
  const [colourEndings, setColourEndings] = useState(true)

  // Read persisted preference on mount (default true if never set)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLOUR_ENDINGS_KEY)
      if (stored !== null) setColourEndings(stored === 'true')
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
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

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
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
              style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 26, lineHeight: 1.15, color: 'var(--d5-ink)' }}
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

      {/* Actions row */}
      <div className="flex gap-3">
        <Link
          href={`/verbs/configure?verb=${infinitive}`}
          className="flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-colors hover:opacity-90"
          style={{ background: 'var(--d5-terracotta)', color: 'var(--d5-paper)' }}
        >
          Practicar este verbo →
        </Link>
        <button
          onClick={toggleColourEndings}
          aria-pressed={colourEndings}
          aria-label="Toggle colour endings"
          title={colourEndings ? 'Hide coloured endings' : 'Show coloured endings'}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
            colourEndings
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Endings</span>
        </button>
      </div>

      {/* Conjugation tables per tense */}
      <div className="space-y-6">
        {TENSES.map((tense) => {
          const data = tenseData.find((d) => d.tense === tense)
          const rows = data?.rows ?? []
          const masteryPct = data?.masteryPct ?? null
          const attempts = data?.attempts ?? 0

          return (
            <section key={tense} className="senda-card overflow-hidden" style={{ padding: 0 }}>
              {/* Tense header */}
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(184,170,153,0.25)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="senda-eyebrow mb-1">{TENSE_LABELS[tense]}</p>
                    <p className="text-[11px]" style={{ color: 'var(--d5-muted)' }}>{TENSE_DESCRIPTIONS[tense]}</p>
                  </div>
                  {masteryPct !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground">{masteryPct}%</p>
                      <p className="text-[10px] text-muted-foreground">{attempts} attempts</p>
                    </div>
                  )}
                </div>

                {/* Mastery bar (only if ≥1 attempt) */}
                {masteryPct !== null && (
                  <div className="relative h-1.5 w-full rounded-full bg-muted mt-2 overflow-hidden">
                    <AnimatedBar
                      pct={masteryPct}
                      className={masteryPct >= 70 ? 'bg-green-500' : masteryPct >= 40 ? 'bg-amber-400' : 'bg-rose-400'}
                    />
                  </div>
                )}
              </div>

              {/* Conjugation table */}
              {rows.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {PRONOUN_ORDER.map((pronoun) => {
                      const row = rows.find((r) => r.pronoun === pronoun)
                      return (
                        <tr key={pronoun} className="border-b last:border-0">
                          <td className="px-5 py-2.5 w-28 font-medium" style={{ color: 'var(--d5-muted)' }}>
                            {PRONOUN_LABELS[pronoun] ?? pronoun}
                          </td>
                          <td className="px-5 py-2.5 font-medium break-words">
                            {row && row.form !== ''
                              ? colourEndings
                                ? <ColouredForm form={row.form} stem={row.stem} />
                                : row.form
                              : <span className="text-muted-foreground/40 text-xs italic">—</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-4 text-sm text-muted-foreground italic">
                  No conjugations seeded for this tense yet.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
