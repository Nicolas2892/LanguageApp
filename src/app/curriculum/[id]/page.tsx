import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SpeakButton } from '@/components/SpeakButton'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import { LevelChip } from '@/components/LevelChip'
import { HardFlagButton } from '@/components/HardFlagButton'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { Concept } from '@/lib/supabase/types'

type Example = { es: string; en: string }
type MasteryState = 'mastered' | 'learning' | 'new'

function getMasteryState(intervalDays: number | undefined): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERY_THRESHOLD) return 'mastered'
  return 'learning'
}

const MASTERY_BADGE: Record<MasteryState, { label: string; style: React.CSSProperties }> = {
  mastered: {
    label: 'Dominado',
    style: { background: 'rgba(196,82,46,0.1)', color: 'var(--d5-terracotta)', border: '1px solid rgba(196,82,46,0.2)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 600 },
  },
  learning: {
    label: 'Aprendiendo',
    style: { background: 'rgba(59,130,246,0.08)', color: 'rgb(59,130,246)', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 600 },
  },
  new: {
    label: 'Nuevo',
    style: { background: 'transparent', color: 'rgba(26,17,8,0.4)', border: '1px solid rgba(26,17,8,0.15)', padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 600 },
  },
}

const EXERCISE_TYPES = [
  { type: 'gap_fill',         label: 'Completar espacios' },
  { type: 'translation',      label: 'Traducción' },
  { type: 'transformation',   label: 'Transformación' },
  { type: 'sentence_builder', label: 'Construir frase' },
  { type: 'error_correction', label: 'Corregir error' },
] as const

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

  // Fetch unit + module in parallel
  const [unitRes, exercisesRes, progressRes] = await Promise.all([
    supabase.from('units').select('id, title, module_id').eq('id', concept.unit_id).single(),
    supabase.from('exercises').select('id, type').eq('concept_id', id),
    supabase
      .from('user_progress')
      .select('interval_days, due_date, repetitions, is_hard')
      .eq('user_id', user.id)
      .eq('concept_id', id)
      .maybeSingle(),
  ])

  type UnitRow     = { id: string; title: string; module_id: string }
  type ProgressRow = { interval_days: number; due_date: string; repetitions: number; is_hard: boolean }
  type ExerciseRow = { id: string; type: string }

  const unit     = unitRes.data     as UnitRow     | null
  const progress = progressRes.data as ProgressRow | null
  const typedExercises = (exercisesRes.data ?? []) as ExerciseRow[]
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
      className="max-w-2xl mx-auto p-6 md:p-10 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <BackgroundMagicS opacity={0.05} />

      {/* Back navigation */}
      <Link
        href={backHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          color: 'var(--d5-warm)',
          marginBottom: 24,
        }}
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        Currículo
      </Link>

      {/* Card 1 — The Narrative */}
      <div
        className="senda-card"
        style={{ position: 'relative', overflow: 'hidden', marginBottom: 16 }}
      >
        {/* Eyebrow + breadcrumb */}
        <div style={{ marginBottom: 12 }}>
          <span className="senda-eyebrow">Concepto</span>
          {moduleName && unit && (
            <p style={{ fontSize: 11, color: 'var(--d5-warm)', marginTop: 4 }}>
              {moduleName} · {unit.title}
            </p>
          )}
        </div>

        {/* Title */}
        <h1 className="senda-heading" style={{ fontSize: 22, marginBottom: 10 }}>
          {concept.title}
        </h1>

        {/* Chips row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <LevelChip level={concept.level} />
          <GrammarFocusChip focus={concept.grammar_focus} />
          <span style={badge.style}>{badge.label}</span>
          <HardFlagButton conceptId={id} initialIsHard={isHard} />
        </div>

        {/* Explanation */}
        <p style={{ fontSize: 14, color: 'var(--d5-ink)', lineHeight: 1.6 }}>
          {concept.explanation}
        </p>

        {/* Attempt count */}
        {attemptCount > 0 && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--d5-warm)', marginTop: 12 }}>
            <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)', flexShrink: 0 }} />
            {attemptCount} ejercicio{attemptCount !== 1 ? 's' : ''} completado{attemptCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Card 2 — The Golden Sentence */}
      {examples.length > 0 && (
        <div className="senda-card" style={{ marginBottom: 16 }}>
          <span className="senda-eyebrow" style={{ display: 'block', marginBottom: 14 }}>Ejemplos</span>
          {examples.map((ex, i) => (
            <div key={i}>
              <div
                style={{
                  borderLeft: '2px solid var(--d5-terracotta)',
                  paddingLeft: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--d5-ink)' }}>{ex.es}</span>
                  <SpeakButton text={ex.es} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--d5-warm)', marginTop: 2 }}>{ex.en}</p>
              </div>
              {i < examples.length - 1 && <WindingPathSeparator />}
            </div>
          ))}
        </div>
      )}

      {/* Card 3 — SRS Status + Practice */}
      <div className="senda-card">
        <span className="senda-eyebrow" style={{ display: 'block', marginBottom: 14 }}>Tu Progreso</span>

        {/* SRS row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--d5-ink)' }}>Estado de repaso</p>
            <p style={{ fontSize: 12, color: 'var(--d5-warm)', marginTop: 2 }}>{srsStatus}</p>
          </div>
          {progress && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--d5-ink)', lineHeight: 1 }}>{progress.repetitions}</p>
              <p style={{ fontSize: 11, color: 'var(--d5-warm)', marginTop: 2 }}>
                {progress.repetitions === 1 ? 'sesión' : 'sesiones'}
              </p>
            </div>
          )}
        </div>

        {/* Practice all button */}
        <Link
          href={`/study?practice=true&concept=${id}`}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            background: 'var(--d5-terracotta)',
            color: 'var(--d5-paper)',
            borderRadius: 9999,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Practicar todo →
        </Link>

        {/* Exercise type pills */}
        {availableTypes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {availableTypes.map(({ type, label }) => (
              <Link
                key={type}
                href={`/study?concept=${id}&types=${type}&practice=true`}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--d5-terracotta)',
                  border: '1px solid rgba(196,82,46,0.3)',
                  borderRadius: 9999,
                  padding: '4px 10px',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Secondary actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Link
            href={`/write?suggested=${id}`}
            style={{
              display: 'block',
              textAlign: 'center',
              border: '1px solid rgba(196,82,46,0.3)',
              color: 'var(--d5-terracotta)',
              borderRadius: 9999,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Escritura libre
          </Link>
          <Link
            href={`/tutor?concept=${id}`}
            style={{
              display: 'block',
              textAlign: 'center',
              border: '1px solid rgba(196,82,46,0.3)',
              color: 'var(--d5-terracotta)',
              borderRadius: 9999,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Consultar tutor
          </Link>
        </div>
      </div>
    </main>
  )
}
