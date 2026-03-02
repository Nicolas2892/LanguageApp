import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccountForm } from './AccountForm'
import type { Profile } from '@/lib/supabase/types'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileData) redirect('/dashboard')
  const profile = profileData as Profile

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
        <h1 className="text-xl font-bold">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
      </div>

      <AccountForm profile={profile} />
    </main>
  )
}
