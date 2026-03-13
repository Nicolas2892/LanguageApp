import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExerciseEditForm } from './ExerciseEditForm'
import { ExerciseDeleteButton } from '@/components/admin/ExerciseDeleteButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminExerciseEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [exerciseRes, conceptsRes] = await Promise.all([
    supabase
      .from('exercises')
      .select('id, concept_id, type, prompt, expected_answer, hint_1, hint_2, source')
      .eq('id', id)
      .single(),
    supabase.from('concepts').select('id, title'),
  ])

  if (!exerciseRes.data) notFound()

  type ExerciseRow = { id: string; concept_id: string; type: string; prompt: string; expected_answer: string | null; hint_1: string | null; hint_2: string | null; source: string }
  type ConceptRow  = { id: string; title: string }

  const exercise   = exerciseRes.data as ExerciseRow
  const allConcepts = (conceptsRes.data ?? []) as ConceptRow[]
  const conceptTitle = allConcepts.find((c) => c.id === exercise.concept_id)?.title ?? exercise.concept_id

  const isAI = exercise.source === 'ai_generated'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/exercises"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Exercises
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Edit exercise</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
            {exercise.type}
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold ${
            isAI
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          }`}>
            {isAI ? 'AI generated' : 'seed'}
          </span>
          <span className="text-sm text-muted-foreground">{conceptTitle}</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <ExerciseEditForm
          exercise={{ ...exercise, concept_title: conceptTitle }}
        />
      </div>

      <div className="border-t pt-4">
        <ExerciseDeleteButton exerciseId={exercise.id} />
      </div>
    </div>
  )
}
