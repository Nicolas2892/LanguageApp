import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SpeakButton } from '@/components/SpeakButton'
import { getMasteryState, getMasteryProgress, MASTERY_BADGE, PRODUCTION_CORRECT_REQUIRED, PRODUCTION_TYPES_REQUIRED } from '@/lib/mastery/badge'
import { ChevronLeft, CheckCircle2, Pencil, Bot, Circle } from 'lucide-react'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { LevelChip } from '@/components/LevelChip'
import { HardFlagButton } from '@/components/HardFlagButton'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { Concept } from '@/lib/supabase/types'
import { userLocalToday } from '@/lib/timezone'
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
  { type: 'free_write',       label: 'Escritura libre' },
  { type: 'listening',        label: 'Comprensión auditiva' },
  { type: 'proofreading',     label: 'Corrección de texto' },
  { type: 'register_shift',   label: 'Cambio de registro' },
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

  // Fetch unit, exercises, progress, timezone (+ hablar verb id if tense-mapped) in parallel
  const [unitRes, exercisesRes, progressRes, hablarRes, profileTzRes] = await Promise.all([
    supabase.from('units').select('id, title, module_id').eq('id', concept.unit_id).single(),
    supabase.from('exercises').select('id, type').eq('concept_id', id),
    supabase
      .from('user_progress')
      .select('interval_days, due_date, repetitions, is_hard, production_mastered')
      .eq('user_id', user.id)
      .eq('concept_id', id)
      .maybeSingle(),
    tenseKey
      ? supabase.from('verbs').select('id').eq('infinitive', 'hablar').single()
      : Promise.resolve({ data: null }),
    supabase.from('profiles').select('timezone').eq('id', user.id).single(),
  ])

  type UnitRow     = { id: string; title: string; module_id: string }
  type ProgressRow = { interval_days: number; due_date: string; repetitions: number; is_hard: boolean; production_mastered: boolean }
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
  const exerciseTypeMap = new Map(typedExercises.map((e) => [e.id, e.type]))

  // Non-gap_fill exercise IDs for production breadth query
  const nonGapFillIds = typedExercises.filter(e => e.type !== 'gap_fill').map(e => e.id)

  // Fetch attempt count, correct non-gap_fill attempts, and module name in parallel
  const [attemptCountResult, correctProductionResult, moduleResult] = await Promise.all([
    exerciseIds.length > 0
      ? supabase
          .from('exercise_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('exercise_id', exerciseIds)
      : Promise.resolve({ count: 0 }),
    nonGapFillIds.length > 0
      ? supabase
          .from('exercise_attempts')
          .select('exercise_id')
          .eq('user_id', user.id)
          .in('exercise_id', nonGapFillIds)
          .eq('is_correct', true)
      : Promise.resolve({ data: [] }),
    unit
      ? supabase.from('modules').select('title').eq('id', unit.module_id).single()
      : Promise.resolve({ data: null }),
  ])

  const attemptCount = attemptCountResult.count ?? 0
  const moduleName = (moduleResult.data as { title: string } | null)?.title ?? null

  // Compute production breadth
  const correctProductionAttempts = (correctProductionResult.data ?? []) as { exercise_id: string }[]
  const correctNonGapFill = correctProductionAttempts.length
  const correctProductionTypes = new Set(
    correctProductionAttempts.map(a => exerciseTypeMap.get(a.exercise_id)).filter(Boolean)
  )
  const uniqueTypes = correctProductionTypes.size
  const masteryProgress = getMasteryProgress(progress?.interval_days, correctNonGapFill, uniqueTypes)

  const isHard = progress?.is_hard ?? false

  // Mastery state (use live production breadth check rather than cached flag)
  const masteryState = getMasteryState(progress?.interval_days, masteryProgress.productionReady)
  const badge = MASTERY_BADGE[masteryState]

  // Parse examples
  const examples: Example[] = Array.isArray(concept.examples)
    ? (concept.examples as unknown[]).filter(
        (e): e is Example =>
          typeof e === 'object' && e !== null && 'es' in e && 'en' in e
      )
    : []

  // SRS status
  const userTz = (profileTzRes.data as { timezone: string | null } | null)?.timezone ?? null
  const srsStatus = (() => {
    if (!progress) return 'No comenzado'
    const today     = userLocalToday(userTz)
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
      <div className="mb-6">
        {/* Title + hard flag */}
        <div className="flex items-start gap-2">
          <h1 className="senda-heading text-xl flex-1">
            {concept.title}
          </h1>
          <HardFlagButton conceptId={id} initialIsHard={isHard} />
        </div>

        {/* Metadata row — all chips on one line */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <LevelChip level={concept.level} />
          <GrammarFocusChip focus={concept.grammar_focus} />
          <span style={badge.style}>{badge.label}</span>
        </div>
      </div>

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
      </div>

      {/* ── Examples ── */}
      {examples.length > 0 && (
        <div className="mt-6">
          <span className="text-xs font-medium block mb-3" style={{ color: 'var(--d5-warm)' }}>Ejemplos</span>
          <div className="flex flex-col gap-3">
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
      )}

      {/* ── Conjugation Insight (only for tense-mapped concepts) ── */}
      {insightRows && tenseKey && (
        <div className="mt-6">
          <span className="text-xs font-medium block mb-1.5" style={{ color: 'var(--d5-warm)' }}>
            Conjugación de ejemplo
          </span>
          <p className="text-xs mb-3" style={{ color: 'var(--d5-muted)' }}>
            hablar · {TENSE_LABELS[tenseKey]}
          </p>
          <ConjugationInsightTable rows={insightRows} />
        </div>
      )}

      <WindingPathSeparator />

      {/* ── CTA zone ── */}
      <Link
        href={`/study?practice=true&concept=${id}`}
        className="senda-cta w-full"
      >
        Practica este concepto →
      </Link>

      {/* Exercise type chips — compact, no eyebrow */}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {availableTypes.map(({ type, label }) => (
            <Link
              key={type}
              href={`/study?concept=${id}&types=${type}&practice=true`}
              className="inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full transition-colors duration-150"
              style={{
                background: 'rgba(196, 82, 46, 0.08)',
                color: 'var(--d5-terracotta)',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* Secondary links — inline row */}
      <div className="flex items-center gap-4 mt-3">
        <Link
          href={`/write?suggested=${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--d5-warm)] hover:text-[var(--d5-terracotta)] transition-colors duration-200"
        >
          <Pencil className="h-3 w-3" />
          Escritura libre
        </Link>
        <Link
          href={`/tutor?concept=${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--d5-warm)] hover:text-[var(--d5-terracotta)] transition-colors duration-200"
        >
          <Bot className="h-3 w-3" />
          Consultar tutor
        </Link>
      </div>

      <WindingPathSeparator />

      {/* ── Tu progreso — unified progress card ── */}
      <div
        className="rounded-2xl"
        style={{
          background: 'rgba(140,106,63,0.07)',
          padding: '1rem 1.25rem',
        }}
      >
        <span className="senda-eyebrow block mb-3">Tu progreso</span>

        {/* SRS status + attempt count row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-foreground font-medium">Próxima revisión</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--d5-warm)' }}>{srsStatus}</p>
          </div>
          <div className="text-right">
            {progress ? (
              <>
                <p className="text-foreground text-xl font-bold leading-none">{progress.repetitions}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--d5-warm)' }}>
                  {progress.repetitions === 1 ? 'sesión' : 'sesiones'}
                </p>
              </>
            ) : attemptCount > 0 ? (
              <>
                <p className="text-foreground text-xl font-bold leading-none">{attemptCount}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--d5-warm)' }}>
                  {attemptCount === 1 ? 'ejercicio' : 'ejercicios'}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {/* Mastery milestones (only for learning state) */}
        {masteryState === 'learning' && (
          <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: '1px solid rgba(140,106,63,0.12)' }}>
            {/* SRS milestone */}
            <div className="flex items-center gap-2">
              {masteryProgress.srsReady ? (
                <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} />
              ) : (
                <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)', flexShrink: 0 }} />
              )}
              <p className="text-xs text-foreground">
                Retención SRS
                <span className="ml-1.5" style={{ color: 'var(--d5-warm)' }}>
                  {progress ? Math.min(progress.interval_days, MASTERY_THRESHOLD) : 0}/{MASTERY_THRESHOLD} días
                </span>
              </p>
            </div>

            {/* Production breadth — correct attempts */}
            <div className="flex items-center gap-2">
              {masteryProgress.correctNonGapFill >= PRODUCTION_CORRECT_REQUIRED ? (
                <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} />
              ) : (
                <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)', flexShrink: 0 }} />
              )}
              <p className="text-xs text-foreground">
                Producción
                <span className="ml-1.5" style={{ color: 'var(--d5-warm)' }}>
                  {masteryProgress.correctNonGapFill}/{PRODUCTION_CORRECT_REQUIRED} correctas
                </span>
              </p>
            </div>

            {/* Production breadth — unique types */}
            <div className="flex items-center gap-2">
              {masteryProgress.uniqueTypes >= PRODUCTION_TYPES_REQUIRED ? (
                <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} />
              ) : (
                <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)', flexShrink: 0 }} />
              )}
              <div className="flex-1">
                <p className="text-xs text-foreground">
                  Variedad
                  <span className="ml-1.5" style={{ color: 'var(--d5-warm)' }}>
                    {masteryProgress.uniqueTypes}/{PRODUCTION_TYPES_REQUIRED} tipos
                  </span>
                </p>
                {correctProductionTypes.size > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(correctProductionTypes).map(type => {
                      const label = EXERCISE_TYPES.find(t => t.type === type)?.label ?? type
                      return (
                        <span
                          key={type}
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 9999,
                            background: 'rgba(196,82,46,0.1)',
                            color: 'var(--d5-terracotta)',
                            fontWeight: 500,
                          }}
                        >
                          {label}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
