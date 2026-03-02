import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SessionConfig } from './SessionConfig'

export default async function ConfigurePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title')
    .order('order_index')

  const typedModules = (modules ?? []) as Array<{ id: string; title: string }>

  return (
    <main className="max-w-md mx-auto p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">New session</h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ✕ Cancel
        </Link>
      </div>
      <SessionConfig modules={typedModules} />
    </main>
  )
}
