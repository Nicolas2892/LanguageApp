import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SessionConfig } from './SessionConfig'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { MASTERY_THRESHOLD } from '@/lib/constants'

export default async function ConfigurePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: modules }, { data: concepts }, { data: progress }, { data: mistakeAttempts }, { count: rawDueCount }] = await Promise.all([
    supabase.from('modules').select('id, title').order('order_index'),
    supabase.from('concepts').select('id, unit_id, units(module_id)'),
    supabase.from('user_progress').select('concept_id, interval_days').eq('user_id', user.id),
    supabase
      .from('exercise_attempts')
      .select('exercise_id')
      .eq('user_id', user.id)
      .lte('ai_score', 1)
      .not('exercise_id', 'is', null)
      .limit(100),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('due_date', today),
  ])

  const dueCount = rawDueCount ?? 0

  type ConceptRow = { id: string; unit_id: string; units: { module_id: string } | null }
  type ProgressRow = { concept_id: string; interval_days: number }

  const typedModules = (modules ?? []) as Array<{ id: string; title: string }>
  const typedConcepts = (concepts ?? []) as ConceptRow[]
  const typedProgress = (progress ?? []) as ProgressRow[]

  // Map concept_id → module_id
  const conceptToModule = new Map<string, string>()
  for (const c of typedConcepts) {
    const moduleId = c.units?.module_id
    if (moduleId) conceptToModule.set(c.id, moduleId)
  }

  // Build mastery counts per module
  const totalByModule = new Map<string, number>()
  const masteredByModule = new Map<string, number>()

  for (const c of typedConcepts) {
    const moduleId = c.units?.module_id
    if (!moduleId) continue
    totalByModule.set(moduleId, (totalByModule.get(moduleId) ?? 0) + 1)
  }

  for (const p of typedProgress) {
    if (p.interval_days < MASTERY_THRESHOLD) continue
    const moduleId = conceptToModule.get(p.concept_id)
    if (!moduleId) continue
    masteredByModule.set(moduleId, (masteredByModule.get(moduleId) ?? 0) + 1)
  }

  const modulesWithMastery = typedModules.map((mod) => ({
    ...mod,
    mastered: masteredByModule.get(mod.id) ?? 0,
    total: totalByModule.get(mod.id) ?? 0,
  }))

  // Compute distinct mistake concept count
  const mistakeExerciseIds = [...new Set(
    (mistakeAttempts ?? [])
      .map((a) => (a as { exercise_id: string | null }).exercise_id)
      .filter((id): id is string => id !== null)
  )]
  let mistakeConceptCount = 0
  if (mistakeExerciseIds.length > 0) {
    const { data: mistakeExercisesData } = await supabase
      .from('exercises')
      .select('concept_id')
      .in('id', mistakeExerciseIds)
    mistakeConceptCount = new Set(
      (mistakeExercisesData ?? []).map((e) => (e as { concept_id: string }).concept_id)
    ).size
  }

  return (
    <main className="max-w-md mx-auto pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:pb-8">
      {/* Compact header */}
      <div className="flex items-center justify-between px-[18px] pt-4 pb-2">
        <Link
          href="/dashboard"
          className="text-[11px] font-semibold"
          style={{ color: 'var(--d5-warm)' }}
        >
          ← Inicio
        </Link>
        <SvgSendaPath size={22} strokeWidth={3.5} />
        <div style={{ width: 22 }} />
      </div>

      {/* Title */}
      <div className="px-[18px] pt-1 pb-[10px]">
        <h1
          style={{
            fontFamily: 'var(--font-lora), serif',
            fontStyle: 'italic',
            fontSize: 22,
            lineHeight: 1.2,
            color: 'var(--d5-ink)',
          }}
        >
          Configura tu Sesión
        </h1>
      </div>

      <WindingPathSeparator />

      <SessionConfig
        modules={modulesWithMastery}
        mistakeConceptCount={mistakeConceptCount}
        dueCount={dueCount}
      />
    </main>
  )
}
