import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SpeakButton } from '@/components/SpeakButton'
import { getMasteryState, MASTERY_BADGE } from '@/lib/mastery/badge'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { LevelChip } from '@/components/LevelChip'
import { HardFlagButton } from '@/components/HardFlagButton'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { Concept } from '@/lib/supabase/types'
import type { VerbTense } from '@/lib/verbs/constants'
import { TENSE_LABELS } from '@/lib/verbs/constants'
import { ConjugationInsightTable, type ConjugationRow } from './ConjugationInsightTable'
import { ExpandableExplanation } from './ConceptDetailClient'

type Example = { es: string; en: string }

const EXERCISE_TYPES = [
  { type: 'gap_fill',         label: 'Completar espacios' },
  { type: 'translation',      label: 'Traducción' },
  { type: 'transformation',   label: 'Transformación' },
  { type: 'sentence_builder', label: 'Construir frase' },
  { type: 'error_correction', label: 'Corregir error' },
] as const

// Maps concept titles (exact DB values) to a VerbTense for the conjugation insight card.
// Only tense-focused concepts are included; connector/periphrasis/ser-estar concepts omitted.
// pluperfect/conditional_perfect are compound tenses not in VerbTense — omitted intentionally.
const CONCEPT_TENSE_MAP: Partial<Record<string, VerbTense>> = {
  'Usos del pretérito indefinido':                        'preterite',
  'Usos del pretérito imperfecto':                        'imperfect',
  'Indefinido vs. imperfecto: contraste narrativo':       'preterite',
  'Verbos de deseo (querer, esperar, desear)':            'present_subjunctive',
  'Verbos de emoción (alegrarse, temer, sorprender)':    'present_subjunctive',
  'Verbos de duda y negación (dudar, no creer, negar)':  'present_subjunctive',
  'Condicional tipo 2: Si + imperfecto de subjuntivo':   'imperfect_subjunctive',
  'Condicional tipo 3: Si + pluscuamperfecto de subjuntivo': 'imperfect_subjunctive',
  'Ojalá + imperfecto de subjuntivo':                    'imperfect_subjunctive',
  'Imperfecto de subjuntivo en estilo indirecto':        'imperfect_subjunctive',
}

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string }>
}

export default async function ConceptDetailPage({ params, searchParams }: Props) {
  const { id }     = await params
  const { filter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch concept
  const { data: conceptData } = await supabase
    .from('concepts')
    .select('*')
    .eq('id', id)
    .single()

  if (!conceptData) notFound()
  const concept = conceptData as Concept

  const tenseKey = CONCEPT_TENSE_MAP[concept.title] ?? null

  // Fetch unit, exercises, progress (+ hablar verb id if tense-mapped) in parallel
  const [unitRes, exercisesRes, progressRes, hablarRes] = await Promise.all([
    supabase.from('units').select('id, title, module_id').eq('id', concept.unit_id).single(),
    supabase.from('exercises').select('id, type').eq('concept_id', id),
    supabase
      .from('user_progress')
      .select('interval_days, due_date, repetitions, is_hard')
      .eq('user_id', user.id)
      .eq('concept_id', id)
      .maybeSingle(),
    tenseKey
      ? supabase.from('verbs').select('id').eq('infinitive', 'hablar').single()
      : Promise.resolve({ data: null }),
  ])

  type UnitRow     = { id: string; title: string; module_id: string }
  type ProgressRow = { interval_days: number; due_date: string; repetitions: number; is_hard: boolean }
  type ExerciseRow = { id: string; type: string }

  const unit     = unitRes.data     as UnitRow     | null
  const progress = progressRes.data as ProgressRow | null
  const typedExercises = (exercisesRes.data ?? []) as ExerciseRow[]

  // Fetch hablar conjugations for the tense insight card
  let insightRows: ConjugationRow[] | null = null
  if (tenseKey && hablarRes.data) {
    const hablarId = (hablarRes.data as { id: string }).id
    const { data: conjData } = await supabase
      .from('verb_conjugations')
      .select('stem, yo, tu, el, nosotros, vosotros, ellos')
      .eq('verb_id', hablarId)
      .eq('tense', tenseKey)
      .single()
    if (conjData) {
      const c = conjData as { stem: string; yo: string; tu: string; el: string; nosotros: string; vosotros: string; ellos: string }
      insightRows = [
        { pronoun: 'yo',          form: c.yo,       stem: c.stem },
        { pronoun: 'tú',          form: c.tu,        stem: c.stem },
        { pronoun: 'él/ella',     form: c.el,        stem: c.stem },
        { pronoun: 'nosotros',    form: c.nosotros,  stem: c.stem },
        { pronoun: 'vosotros',    form: c.vosotros,  stem: c.stem },
        { pronoun: 'ellos/ellas', form: c.ellos,     stem: c.stem },
      ]
    }
  }
  const exerciseIds = typedExercises.map((e) => e.id)
  const exerciseTypes = new Set(typedExercises.map((e) => e.type))

  // Count exercise attempts for this concept
  let attemptCount = 0
  if (exerciseIds.length > 0) {
    const { count } = await supabase
      .from('exercise_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('exercise_id', exerciseIds)
    attemptCount = count ?? 0
  }

  // Fetch module name
  let moduleName: string | null = null
  if (unit) {
    const { data: moduleData } = await supabase
      .from('modules')
      .select('title')
      .eq('id', unit.module_id)
      .single()
    moduleName = (moduleData as { title: string } | null)?.title ?? null
  }

  const isHard = progress?.is_hard ?? false

  // Mastery state
  const masteryState = getMasteryState(progress?.interval_days)
  const badge = MASTERY_BADGE[masteryState]

  // Parse examples
  const examples: Example[] = Array.isArray(concept.examples)
    ? (concept.examples as unknown[]).filter(
        (e): e is Example =>
          typeof e === 'object' && e !== null && 'es' in e && 'en' in e
      )
    : []

  // SRS status
  const srsStatus = (() => {
    if (!progress) return 'No comenzado'
    const today     = new Date().toISOString().split('T')[0]
    const daysUntil = Math.ceil(
      (new Date(progress.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil <= 0) return 'Pendiente ahora'
    if (daysUntil === 1) return 'Pendiente mañana'
    return `En ${daysUntil} días`
  })()

  // Back link preserves filter param
  const backHref = filter && ['new', 'learning', 'mastered'].includes(filter)
    ? `/curriculum?filter=${filter}`
    : '/curriculum'

  // Available exercise types for this concept
  const availableTypes = EXERCISE_TYPES.filter(({ type }) => exerciseTypes.has(type))

  return (
    <main
      className="max-w-2xl mx-auto px-6 pt-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] md:px-10 md:pt-10 lg:pb-10 animate-page-in"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <BackgroundMagicS opacity={0.05} />

      {/* Back navigation */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm mb-6"
        style={{ color: 'var(--d5-warm)' }}
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Currículo
      </Link>

      {/* ── Header section ── */}
      <div className="mb-4">
        {/* Level chip — above title (mockup pattern) */}
        <div className="mb-2">
          <LevelChip level={concept.level} />
        </div>

        {/* Title + hard flag */}
        <div className="flex items-start gap-2">
          <h1 className="senda-heading text-xl flex-1">
            {concept.title}
          </h1>
          <HardFlagButton conceptId={id} initialIsHard={isHard} />
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <GrammarFocusChip focus={concept.grammar_focus} />
          <span style={badge.style}>{badge.label}</span>
          {moduleName && unit && (
            <span className="text-xs" style={{ color: 'var(--d5-warm)' }}>
              {moduleName} · {unit.title}
            </span>
          )}
        </div>
      </div>

      <WindingPathSeparator />

      {/* ── Explanation (tinted container, clamped) ── */}
      <div
        className="rounded-2xl"
        style={{
          background: 'rgba(26,17,8,0.05)',
          padding: '1rem 1.25rem',
        }}
      >
        <span className="senda-eyebrow block mb-2">Cómo funciona</span>
        <ExpandableExplanation text={concept.explanation} />
        {attemptCount > 0 && (
          <p className="flex items-center gap-1.5 text-xs mt-3" style={{ color: 'var(--d5-warm)' }}>
            <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} />
            {attemptCount} ejercicio{attemptCount !== 1 ? 's' : ''} completado{attemptCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Examples ── */}
      {examples.length > 0 && (
        <>
          <WindingPathSeparator />
          <div>
            <span className="senda-eyebrow block mb-3">Ejemplos</span>
            <div className="flex flex-col gap-4">
              {examples.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: '2px solid var(--d5-terracotta)',
                    paddingLeft: '0.75rem',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-base font-medium">{ex.es}</span>
                    <SpeakButton text={ex.es} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--d5-warm)' }}>{ex.en}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Conjugation Insight (only for tense-mapped concepts) ── */}
      {insightRows && tenseKey && (
        <>
          <WindingPathSeparator />
          <div>
            <span className="senda-eyebrow block mb-1.5">
              Conjugación de ejemplo
            </span>
            <p className="text-xs mb-3" style={{ color: 'var(--d5-muted)' }}>
              hablar · {TENSE_LABELS[tenseKey]}
            </p>
            <ConjugationInsightTable rows={insightRows} />
          </div>
        </>
      )}

      <WindingPathSeparator />

      {/* ── SRS Status ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-foreground text-sm font-medium">Próxima revisión</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--d5-warm)' }}>{srsStatus}</p>
        </div>
        {progress && (
          <div className="text-right">
            <p className="text-foreground text-xl font-bold leading-none">{progress.repetitions}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--d5-warm)' }}>
              {progress.repetitions === 1 ? 'sesión' : 'sesiones'}
            </p>
          </div>
        )}
      </div>

      {/* ── CTAs (stacked full-width) ── */}
      <div className="flex flex-col gap-3">
        {/* Primary CTA */}
        <Link
          href={`/study?practice=true&concept=${id}`}
          className="block w-full text-center rounded-full text-sm font-semibold transition-colors duration-200"
          style={{
            background: 'var(--d5-terracotta)',
            color: 'var(--d5-paper)',
            padding: '0.75rem 1rem',
          }}
        >
          Practicar este concepto →
        </Link>

        {/* Secondary CTAs */}
        <Link
          href={`/write?suggested=${id}`}
          className="block w-full text-center rounded-full text-sm font-medium transition-colors duration-200 hover:bg-[#C4522E]/10"
          style={{
            border: '1.5px solid rgba(196,82,46,0.3)',
            color: 'var(--d5-terracotta)',
            padding: '0.625rem 1rem',
          }}
        >
          Escritura libre
        </Link>
        <Link
          href={`/tutor?concept=${id}`}
          className="block w-full text-center rounded-full text-sm font-medium transition-colors duration-200 hover:bg-[#C4522E]/10"
          style={{
            border: '1.5px solid rgba(196,82,46,0.3)',
            color: 'var(--d5-terracotta)',
            padding: '0.625rem 1rem',
          }}
        >
          Consultar tutor
        </Link>
      </div>

      {/* Exercise type pills (below CTAs, less prominent) */}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {availableTypes.map(({ type, label }) => (
            <Link
              key={type}
              href={`/study?concept=${id}&types=${type}&practice=true`}
              className="text-xs font-medium rounded-full transition-colors duration-200 hover:bg-[#C4522E]/10"
              style={{
                color: 'var(--d5-terracotta)',
                border: '1.5px solid rgba(196,82,46,0.3)',
                padding: '0.375rem 0.75rem',
                minHeight: '2.75rem',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
