import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TutorChat } from './TutorChat'

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ concept?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { concept: conceptId } = await searchParams

  let conceptTitle: string | undefined
  if (conceptId) {
    const { data } = await supabase
      .from('concepts')
      .select('title')
      .eq('id', conceptId)
      .single()
    conceptTitle = (data as { title: string } | null)?.title
  }

  return (
    <div className="flex flex-col h-[100dvh] pb-[calc(3.125rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div>
          <h1 className="font-semibold">AI Tutor</h1>
          <p className="text-xs text-muted-foreground">Powered by Claude</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ✕ Close
        </Link>
      </header>

      {/* Chat fills remaining height */}
      <div className="flex-1 min-h-0">
        <TutorChat conceptId={conceptId} conceptTitle={conceptTitle} />
      </div>
    </div>
  )
}
