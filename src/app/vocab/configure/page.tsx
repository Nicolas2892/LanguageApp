import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import { VocabConfig } from './VocabConfig'
import { WindingPathSeparator } from '@/components/WindingPathSeparator'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'

export default async function VocabConfigurePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  return (
    <main className="relative overflow-hidden max-w-md mx-auto pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:pb-8 animate-page-in">
      <BackgroundMagicS opacity={0.05} />
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link
          href="/verbs"
          className="text-[11px] font-semibold"
          style={{ color: 'var(--d5-warm)' }}
        >
          ← Léxico
        </Link>
        <SvgSendaPath size={22} strokeWidth={3.5} />
        <div style={{ width: 22 }} />
      </div>

      {/* Title */}
      <div className="px-4 pt-1 pb-3">
        <h1
          className="senda-heading"
          style={{ fontSize: 22 }}
        >
          Práctica de Vocabulario
        </h1>
      </div>

      <WindingPathSeparator />

      <VocabConfig />
    </main>
  )
}
