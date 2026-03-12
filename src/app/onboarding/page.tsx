import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiagnosticSession } from './DiagnosticSession'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import { SvgSendaPath } from '@/components/SvgSendaPath'
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
    <WelcomeScreen>
      <main className="min-h-screen flex items-start justify-center bg-background">
        <div className="relative overflow-hidden w-full max-w-2xl mx-auto p-6 md:p-10">
          <BackgroundMagicS />
          <div className="relative mb-8 space-y-2">
            <SvgSendaPath size={28} />
            <h1 className="senda-heading text-2xl">¡Bienvenido! Veamos tu nivel.</h1>
            <p className="text-sm text-[var(--d5-muted)]">
              Responde estas {items.length} preguntas — sin pistas, sin presión. Tus resultados
              personalizarán tu repaso desde el inicio.
            </p>
            <p className="text-xs text-[var(--d5-muted)]">Tarda unos 3 minutos.</p>
          </div>
          <ErrorBoundary>
            <DiagnosticSession items={items} />
          </ErrorBoundary>
        </div>
      </main>
    </WelcomeScreen>
  )
}
