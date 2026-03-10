import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionConfig } from './SessionConfig'
import { MASTERY_THRESHOLD } from '@/lib/constants'

export default async function ConfigurePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: modules }, { data: concepts }, { data: progress }, { data: mistakeAttempts }] = await Promise.all([
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
  ])

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
    <main className="max-w-md mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Nueva Sesión</h1>
        <p className="text-sm text-muted-foreground mt-1">Personaliza Tu Estudio</p>
      </div>
      <SessionConfig modules={modulesWithMastery} mistakeConceptCount={mistakeConceptCount} />
    </main>
  )
}
