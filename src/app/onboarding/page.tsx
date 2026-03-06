import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiagnosticSession } from './DiagnosticSession'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DIAGNOSTIC_CONCEPT_TITLES } from './diagnosticConcepts'
import type { Concept, Exercise, Profile } from '@/lib/supabase/types'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // If already completed, skip to dashboard
  const { data: profileData } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'onboarding_completed'> | null
  if (profile?.onboarding_completed) redirect('/dashboard')

  // Fetch the 6 diagnostic concepts by title
  const { data: conceptsData } = await supabase
    .from('concepts')
    .select('id, unit_id, type, title, explanation, examples, difficulty, created_at')
    .in('title', [...DIAGNOSTIC_CONCEPT_TITLES])
    .order('difficulty')

  const concepts = (conceptsData ?? []) as Concept[]

  // Fetch one exercise per concept (the first one, by insertion order)
  const conceptIds = concepts.map((c) => c.id)
  const { data: exercisesData } = await supabase
    .from('exercises')
    .select('id, concept_id, type, prompt, expected_answer, answer_variants, hint_1, hint_2, created_at')
    .in('concept_id', conceptIds)

  const exercises = (exercisesData ?? []) as Exercise[]

  // Pick the first exercise for each concept (deterministic)
  const exerciseByConceptId = new Map<string, Exercise>()
  for (const ex of exercises) {
    if (!exerciseByConceptId.has(ex.concept_id)) {
      exerciseByConceptId.set(ex.concept_id, ex)
    }
  }

  // Build ordered items (skip concepts with no exercise)
  const items = concepts
    .map((c) => {
      const exercise = exerciseByConceptId.get(c.id)
      return exercise ? { concept: c, exercise } : null
    })
    .filter((item): item is { concept: Concept; exercise: Exercise } => item !== null)

  return (
    <main className="min-h-screen flex items-start justify-center bg-background">
      <div className="w-full max-w-xl mx-auto p-6 md:p-10">
        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl font-bold">Welcome! Let&apos;s see where you are.</h1>
          <p className="text-muted-foreground text-sm">
            Answer these {items.length} questions — no hints, no pressure. Your results will
            personalise your study queue from the start.
          </p>
          <p className="text-xs text-muted-foreground">Takes about 3 minutes.</p>
        </div>
        <ErrorBoundary>
          <DiagnosticSession items={items} />
        </ErrorBoundary>
      </div>
    </main>
  )
}
