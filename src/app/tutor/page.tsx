import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SvgSendaPath } from '@/components/SvgSendaPath'
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
      <header
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--d5-line)' }}
      >
        <SvgSendaPath size={24} />
        <div>
          <p className="senda-eyebrow">Tu Tutor de Español</p>
          <h1 className="senda-heading text-xl">Tutor IA</h1>
        </div>
      </header>

      {/* Chat fills remaining height */}
      <div className="flex-1 min-h-0">
        <TutorChat conceptId={conceptId} conceptTitle={conceptTitle} />
      </div>
    </div>
  )
}
