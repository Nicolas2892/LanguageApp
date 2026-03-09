import { createServiceClient } from '@/lib/supabase/service'
import { AdminStatCard } from '@/components/admin/AdminStatCard'

export async function AdminOverviewDeferred() {
  const service = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [usersRes, activeTodayRes, attemptsRes] = await Promise.all([
    service.from('profiles').select('id', { count: 'exact', head: true }),
    service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('last_studied_date', today),
    service
      .from('exercise_attempts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today),
  ])

  return (
    <>
      <AdminStatCard
        label="Total users"
        value={usersRes.count ?? 0}
      />
      <AdminStatCard
        label="Active today"
        value={activeTodayRes.count ?? 0}
        sub="Users who studied today"
      />
      <AdminStatCard
        label="Attempts today"
        value={attemptsRes.count ?? 0}
        sub="Exercise submissions today"
      />
    </>
  )
}

export function AdminOverviewDeferredSkeleton() {
  return (
    <>
      <div className="animate-pulse rounded-xl bg-muted h-24" />
      <div className="animate-pulse rounded-xl bg-muted h-24" />
      <div className="animate-pulse rounded-xl bg-muted h-24" />
    </>
  )
}
