import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Profile, Concept } from '@/lib/supabase/types'
import { MASTERY_THRESHOLD } from '@/lib/constants'

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
    // Any user_progress row = "ever studied" (for isNewUser check)
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // interval_days >= MASTERY_THRESHOLD = mastered
    supabase
      .from('user_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('interval_days', MASTERY_THRESHOLD),
    // Weakest unmastered concept for free-write card
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
  const masteryPct = totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0

  const isNewUser = studiedCount === 0

  // Fetch the concept title for the free-write card
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

  return (
    <main className="max-w-xl mx-auto p-6 md:p-10 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {profile?.display_name ?? 'learner'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Today's study card */}
      <div className="border rounded-xl p-6 space-y-4">
        {isNewUser ? (
          <>
            <p className="font-semibold text-lg">Ready to start learning?</p>
            <p className="text-muted-foreground text-sm">
              Your first session will introduce 5 concepts from the curriculum.
            </p>
          </>
        ) : dueCount > 0 ? (
          <>
            <p className="font-semibold text-lg">
              {dueCount} concept{dueCount !== 1 ? 's' : ''} due for review
            </p>
            <p className="text-muted-foreground text-sm">
              The SRS has selected these based on your past performance.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-lg">All caught up!</p>
            <p className="text-muted-foreground text-sm">
              No reviews due today. Come back tomorrow — or practice freely now.
            </p>
          </>
        )}

        {(isNewUser || dueCount > 0) ? (
          <Button asChild className="w-full">
            <Link href={isNewUser ? '/study' : '/study/configure'}>
              {isNewUser ? 'Start learning →' : `Start review (${dueCount}) →`}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href="/study/configure">Practice anyway →</Link>
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Streak</p>
          <p className="text-2xl font-bold">{profile?.streak ?? 0}</p>
          <p className="text-muted-foreground text-xs">days</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Mastered</p>
          <p className="text-2xl font-bold">{masteredCount}</p>
          <p className="text-muted-foreground text-xs">of {totalConcepts}</p>
        </div>
      </div>

      {/* Free write card */}
      {!isNewUser && writeConcept && (
        <div className="border rounded-xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Free write</p>
          <p className="font-semibold">Practice: {writeConcept.title}</p>
          <p className="text-sm text-muted-foreground">
            Claude will generate a writing topic for this concept on-demand.
          </p>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/write?concept=${writeConcept.id}`}>Write about this →</Link>
          </Button>
        </div>
      )}

      {/* Curriculum progress */}
      {!isNewUser && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Curriculum progress</span>
            <span className="font-medium">{masteryPct}%</span>
          </div>
          <Progress value={masteryPct} className="h-2" />
        </div>
      )}

      {/* Practice by type */}
      {!isNewUser && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Practice by type</p>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'gap_fill',         label: 'Gap fill' },
              { type: 'translation',       label: 'Translation' },
              { type: 'transformation',    label: 'Transformation' },
              { type: 'sentence_builder',  label: 'Sentence builder' },
              { type: 'error_correction',  label: 'Error correction' },
            ].map(({ type, label }) => (
              <Button key={type} asChild variant="outline" size="sm">
                <Link href={`/study?types=${type}`}>{label}</Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { href: '/tutor', label: 'AI Tutor', desc: 'Ask questions, get examples, practice freely' },
          { href: '/progress', label: 'Progress', desc: 'Charts, accuracy stats, activity heatmap' },
          { href: '/curriculum', label: 'Curriculum', desc: 'Browse all concepts and your mastery status' },
        ].map(({ href, label, desc }) => (
          <div key={href} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={href}>Open →</Link>
            </Button>
          </div>
        ))}
      </div>
    </main>
  )
}
