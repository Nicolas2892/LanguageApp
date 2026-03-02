import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { WriteSession } from './WriteSession'
import type { Concept } from '@/lib/supabase/types'

interface Props {
  searchParams: Promise<{ concept?: string }>
}

export default async function WritePage({ searchParams }: Props) {
  const { concept: conceptId } = await searchParams
  if (!conceptId) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: concept, error } = await supabase
    .from('concepts')
    .select('id, title')
    .eq('id', conceptId)
    .single()

  if (error || !concept) redirect('/dashboard')
  const typedConcept = concept as Pick<Concept, 'id' | 'title'>

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold">Free write</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Claude will generate a writing prompt — use the concept naturally in your answer.
        </p>
      </div>

      <ErrorBoundary>
        <WriteSession concept={typedConcept} />
      </ErrorBoundary>
    </main>
  )
}
