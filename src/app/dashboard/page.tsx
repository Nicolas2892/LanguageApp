import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Profile, Concept } from '@/lib/supabase/types'
import { MASTERY_THRESHOLD } from '@/lib/constants'
import {
  Flame, Trophy, BookOpen, Sparkles, PenLine,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const [profileRes, dueRes, totalConceptsRes, studiedRes, masteredRes, weakestProgressRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('due_date', today),
    supabase
      .from('concepts')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('interval_days', MASTERY_THRESHOLD),
    supabase
      .from('user_progress')
      .select('concept_id, interval_days')
      .eq('user_id', user.id)
      .lt('interval_days', MASTERY_THRESHOLD)
      .order('interval_days', { ascending: true })
      .limit(1),
  ])

  const profile = profileRes.data as Profile | null
  const dueCount = dueRes.count ?? 0
  const totalConcepts = totalConceptsRes.count ?? 0
  const studiedCount = studiedRes.count ?? 0
  const masteredCount = masteredRes.count ?? 0
  const newConceptsCount = totalConcepts - studiedCount
  const learningCount = studiedCount - masteredCount
  const isNewUser = studiedCount === 0

  const weakestConceptId = (weakestProgressRes.data?.[0] as { concept_id: string } | undefined)?.concept_id ?? null
  let writeConcept: Pick<Concept, 'id' | 'title'> | null = null
  if (!isNewUser && weakestConceptId) {
    const { data: conceptData } = await supabase
      .from('concepts')
      .select('id, title')
      .eq('id', weakestConceptId)
      .single()
    writeConcept = conceptData as Pick<Concept, 'id' | 'title'> | null
  }

  const masteredPct = totalConcepts > 0 ? (masteredCount / totalConcepts) * 100 : 0
  const learningPct = totalConcepts > 0 ? (learningCount / totalConcepts) * 100 : 0

  return (
    <main className="max-w-lg mx-auto p-6 md:p-8 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-8">
      {/* Greeting + level badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hola, {profile?.display_name ?? 'learner'}
          </h1>
          {profile?.current_level && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              {profile.current_level}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats + progress — unified status card */}
      <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-2xl font-extrabold text-orange-500 leading-none">{profile?.streak ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">day streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-2xl font-extrabold leading-none">{masteredCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">of {totalConcepts} mastered</p>
            </div>
          </div>
        </div>

        {/* Progress bar — only for non-new users */}
        {!isNewUser && (
          <div className="space-y-1.5">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted gap-0.5">
              <div
                className="bg-orange-500 transition-all duration-500 rounded-l-full"
                style={{ width: `${masteredPct}%` }}
              />
              <div
                className="bg-amber-300 transition-all duration-500"
                style={{ width: `${learningPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {masteredCount} mastered · {learningCount} learning · {newConceptsCount} new
            </p>
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {/* Review card */}
        <div className="border border-l-4 border-l-orange-500 rounded-xl p-6 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Review</p>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          {studiedCount === 0 ? (
            <>
              <p className="text-xl font-bold">No reviews yet</p>
              <p className="text-muted-foreground text-sm">Complete your first session to begin spaced repetition.</p>
            </>
          ) : dueCount > 0 ? (
            <>
              <p className="text-xl font-bold">
                {dueCount} concept{dueCount !== 1 ? 's' : ''} due today
              </p>
              <Button asChild className="w-full rounded-full active:scale-95 transition-transform">
                <Link href="/study">Start review →</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-xl font-bold">All caught up!</p>
              <p className="text-muted-foreground text-sm">No reviews due. Come back tomorrow.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/study/configure">Practice anyway →</Link>
              </Button>
            </>
          )}
        </div>

        {/* Learn new card */}
        {newConceptsCount > 0 && (
          <div className="border border-l-4 border-l-orange-500 rounded-xl p-6 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Learn new</p>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold">
              {newConceptsCount} concept{newConceptsCount !== 1 ? 's' : ''} waiting
            </p>
            <Button asChild className="w-full rounded-full active:scale-95 transition-transform">
              <Link href="/study?mode=new">Start learning →</Link>
            </Button>
          </div>
        )}

        {/* Free write card */}
        {!isNewUser && writeConcept && (
          <div className="border border-l-4 border-l-orange-500 rounded-xl p-6 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Free write</p>
              <PenLine className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold">{writeConcept.title}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/write?suggested=${writeConcept.id}`}>Write about this →</Link>
            </Button>
          </div>
        )}
      </div>

    </main>
  )
}
