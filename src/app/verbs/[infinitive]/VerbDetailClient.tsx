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

function ColouredForm({ form, stem }: { form: string; stem: string }) {
  if (stem === '' || !form.startsWith(stem)) {
    // Fully irregular or stem mismatch — colour the whole form
    return <span className="text-primary font-semibold">{form}</span>
  }
  const ending = form.substring(stem.length)
  return (
    <>
      <span className="text-muted-foreground">{stem}</span>
      <span className="text-primary font-semibold">{ending}</span>
    </>
  )
}

export function VerbDetailClient({ verbId, infinitive, english, verbGroup, favorited, tenseData }: Props) {
  const [colourEndings, setColourEndings] = useState(false)

  // Read persisted preference on mount
  useEffect(() => {
    try {
      setColourEndings(localStorage.getItem(COLOUR_ENDINGS_KEY) === 'true')
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{infinitive}</h1>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              -{verbGroup}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{english}</p>
        </div>
        <VerbFavoriteButton verbId={verbId} initialFavorited={favorited} size="md" />
      </div>

      {/* Actions row */}
      <div className="flex gap-3">
        <Link
          href={`/verbs/configure?verb=${infinitive}`}
          className="flex flex-1 items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Practice this verb →
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
            <section key={tense} className="bg-card rounded-xl border shadow-sm overflow-hidden">
              {/* Tense header */}
              <div className="px-5 py-3 border-b bg-muted/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{TENSE_LABELS[tense]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{TENSE_DESCRIPTIONS[tense]}</p>
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
                          <td className="px-5 py-2.5 text-muted-foreground w-28 font-medium">
                            {PRONOUN_LABELS[pronoun] ?? pronoun}
                          </td>
                          <td className="px-5 py-2.5 font-medium">
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
