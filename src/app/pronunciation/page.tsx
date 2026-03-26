import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/routes'
import { PronunciationHub } from './PronunciationHub'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'
import type { PronunciationProgress } from '@/lib/supabase/types'

export default async function PronunciationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  const { data: progressRows } = await supabase
    .from('pronunciation_progress')
    .select('category, attempt_count, correct_count')
    .eq('user_id', user.id)

  const progress = (progressRows as Pick<PronunciationProgress, 'category' | 'attempt_count' | 'correct_count'>[] ?? [])

  return (
    <main className="relative overflow-hidden max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10 animate-page-in">
      <BackgroundMagicS />
      <PronunciationHub progress={progress} />
    </main>
  )
}
