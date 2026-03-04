import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SpeakButton } from '@/components/SpeakButton'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import { ChevronLeft, BookOpen, PenLine, MessageSquare } from 'lucide-react'
import { GrammarFocusChip } from '@/components/GrammarFocusChip'
import type { Concept } from '@/lib/supabase/types'

type Example = { es: string; en: string }
type MasteryState = 'mastered' | 'learning' | 'new'

function getMasteryState(intervalDays: number | undefined): MasteryState {
  if (intervalDays === undefined) return 'new'
  if (intervalDays >= MASTERY_THRESHOLD) return 'mastered'
  return 'learning'
}

const MASTERY_BADGE: Record<MasteryState, { label: string; className: string }> = {
  mastered: { label: 'Mastered', className: 'bg-green-100 text-green-800 border-green-200' },
  learning: { label: 'Learning', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  new:      { label: 'New',      className: 'bg-muted text-muted-foreground border-transparent' },
}

function DifficultyBars({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-3 rounded-full ${i <= difficulty ? 'bg-orange-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

const EXERCISE_TYPES = [
  { type: 'gap_fill',         label: 'Gap fill' },
  { type: 'translation',      label: 'Translation' },
  { type: 'transformation',   label: 'Transformation' },
  { type: 'sentence_builder', label: 'Sentence builder' },
  { type: 'error_correction', label: 'Error correction' },
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
    supabase.from('exercises').select('type').eq('concept_id', id),
    supabase
      .from('user_progress')
      .select('interval_days, due_date, repetitions')
      .eq('user_id', user.id)
      .eq('concept_id', id)
      .maybeSingle(),
  ])

  type UnitRow     = { id: string; title: string; module_id: string }
  type ProgressRow = { interval_days: number; due_date: string; repetitions: number }
  type ExerciseRow = { type: string }

  const unit     = unitRes.data     as UnitRow     | null
  const progress = progressRes.data as ProgressRow | null
  const exerciseTypes = new Set(((exercisesRes.data ?? []) as ExerciseRow[]).map((e) => e.type))

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
    if (!progress) return 'Not started'
    const today     = new Date().toISOString().split('T')[0]
    const daysUntil = Math.ceil(
      (new Date(progress.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil <= 0) return 'Due now'
    if (daysUntil === 1) return 'Due tomorrow'
    return `Due in ${daysUntil} days`
  })()

  // Back link preserves filter param
  const backHref = filter && ['new', 'learning', 'mastered'].includes(filter)
    ? `/curriculum?filter=${filter}`
    : '/curriculum'

  // Available exercise types for this concept
  const availableTypes = EXERCISE_TYPES.filter(({ type }) => exerciseTypes.has(type))

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Back navigation */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Curriculum
      </Link>

      {/* Breadcrumb + title */}
      <div className="space-y-2">
        {moduleName && unit && (
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {moduleName} · {unit.title}
          </p>
        )}
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold tracking-tight flex-1 min-w-0">{concept.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <GrammarFocusChip focus={concept.grammar_focus} />
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <DifficultyBars difficulty={concept.difficulty} />
      </div>

      {/* Explanation */}
      <div className="bg-card rounded-xl border p-4">
        <p className="text-sm leading-relaxed">{concept.explanation}</p>
      </div>

      {/* Examples table */}
      {examples.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Examples</h2>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground w-1/2">Spanish</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-1/2">English</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {examples.map((ex, i) => (
                  <tr key={i} className="bg-card">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{ex.es}</span>
                        <SpeakButton text={ex.es} />
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{ex.en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SRS status */}
      <div className="bg-card rounded-xl border p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Review status</p>
          <p className="text-xs text-muted-foreground">{srsStatus}</p>
        </div>
        {progress && (
          <div className="text-right">
            <p className="text-lg font-bold leading-none">{progress.repetitions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progress.repetitions === 1 ? 'session' : 'sessions'}
            </p>
          </div>
        )}
      </div>

      {/* Practice actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Practice</h2>

        <Button asChild className="w-full rounded-full active:scale-95 transition-transform">
          <Link href={`/study?concept=${id}`}>
            <BookOpen className="h-4 w-4 mr-2" />
            Practice all
          </Link>
        </Button>

        {availableTypes.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {availableTypes.map(({ type, label }) => (
              <Button key={type} asChild variant="outline" size="sm" className="justify-start">
                <Link href={`/study?concept=${id}&types=${type}&practice=true`}>{label}</Link>
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link href={`/write?suggested=${id}`}>
              <PenLine className="h-4 w-4 mr-2" />
              Free write
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/tutor?concept=${id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask tutor
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
