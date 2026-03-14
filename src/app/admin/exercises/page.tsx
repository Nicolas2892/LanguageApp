import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const EXERCISE_TYPES = ['gap_fill', 'transformation', 'translation', 'free_write', 'sentence_builder', 'error_correction', 'listening', 'proofreading', 'register_shift']
const SOURCE_OPTIONS = ['seed', 'ai_generated'] as const

interface Props {
  searchParams: Promise<{ concept?: string; type?: string; source?: string }>
}

function SourceBadge({ source }: { source: string }) {
  const isAI = source === 'ai_generated'
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap ${
      isAI
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    }`}>
      {isAI ? 'AI' : 'seed'}
    </span>
  )
}

export default async function AdminExercisesPage({ searchParams }: Props) {
  const { concept: conceptFilter, type: typeFilter, source: sourceFilter } = await searchParams
  const supabase = await createClient()

  const [exercisesQueryBuilder, conceptsRes] = await Promise.all([
    (async () => {
      let q = supabase
        .from('exercises')
        .select('id, concept_id, type, prompt, expected_answer, hint_1, hint_2, source')
        .order('created_at', { ascending: false })
        .limit(100)
      if (conceptFilter) q = q.eq('concept_id', conceptFilter)
      if (typeFilter)    q = q.eq('type', typeFilter)
      if (sourceFilter && (SOURCE_OPTIONS as readonly string[]).includes(sourceFilter)) {
        q = q.eq('source', sourceFilter as 'seed' | 'ai_generated')
      }
      return q
    })(),
    supabase.from('concepts').select('id, title').order('title'),
  ])

  type ExerciseRow = {
    id: string
    concept_id: string
    type: string
    prompt: string
    expected_answer: string | null
    hint_1: string | null
    hint_2: string | null
    source: string
  }
  type ConceptRow = { id: string; title: string }

  const exercises = (exercisesQueryBuilder.data ?? []) as ExerciseRow[]
  const allConcepts = (conceptsRes.data ?? []) as ConceptRow[]

  const conceptTitleById = new Map(allConcepts.map((c) => [c.id, c.title]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          {conceptFilter || typeFilter || sourceFilter ? ' (filtered)' : ''}
          {' '}— showing up to 100
        </p>
      </div>

      {/* Filters (no-JS GET form) */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label htmlFor="concept-filter" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Concept
          </label>
          <select
            id="concept-filter"
            name="concept"
            defaultValue={conceptFilter ?? ''}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[200px]"
          >
            <option value="">All concepts</option>
            {allConcepts.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="type-filter" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Type
          </label>
          <select
            id="type-filter"
            name="type"
            defaultValue={typeFilter ?? ''}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All types</option>
            {EXERCISE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="source-filter" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Source
          </label>
          <select
            id="source-filter"
            name="source"
            defaultValue={sourceFilter ?? ''}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All sources</option>
            <option value="seed">seed</option>
            <option value="ai_generated">ai_generated</option>
          </select>
        </div>

        <button
          type="submit"
          className="h-9 px-4 rounded-md border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          Filter
        </button>

        {(conceptFilter || typeFilter || sourceFilter) && (
          <Link
            href="/admin/exercises"
            className="h-9 px-4 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
          >
            Clear
          </Link>
        )}
      </form>

      {exercises.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No exercises found.</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Prompt</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Expected answer</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Concept</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Source</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Hints</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Edit</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex, i) => (
                <tr key={ex.id} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="px-4 py-2.5 align-top">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground whitespace-nowrap">
                      {ex.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-top max-w-[280px]">
                    <p className="line-clamp-2 text-sm">{ex.prompt}</p>
                  </td>
                  <td className="px-4 py-2.5 align-top max-w-[200px] hidden md:table-cell">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {ex.expected_answer ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 align-top hidden lg:table-cell">
                    <Link
                      href={`/admin/exercises?concept=${ex.concept_id}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {conceptTitleById.get(ex.concept_id) ?? ex.concept_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <SourceBadge source={ex.source} />
                  </td>
                  <td className="px-4 py-2.5 align-top text-xs text-muted-foreground whitespace-nowrap">
                    {ex.hint_1 ? '✓' : '—'} / {ex.hint_2 ? '✓' : '—'}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <Link
                      href={`/admin/exercises/${ex.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
