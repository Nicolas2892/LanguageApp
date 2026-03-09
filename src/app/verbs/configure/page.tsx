import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerbConfig } from './VerbConfig'

interface Props {
  searchParams: Promise<{ verb?: string }>
}

export default async function VerbConfigurePage({ searchParams }: Props) {
  const { verb } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { count } = await supabase
    .from('user_verb_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const favoriteCount = count ?? 0

  return (
    <main className="max-w-lg mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verb Drills</h1>
        <p className="text-sm text-muted-foreground mt-1">In-sentence conjugation practice</p>
      </div>

      <VerbConfig favoriteCount={favoriteCount} singleVerb={verb ?? null} />
    </main>
  )
}
