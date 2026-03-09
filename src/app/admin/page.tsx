import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { AdminOverviewDeferred, AdminOverviewDeferredSkeleton } from './AdminOverviewDeferred'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [conceptsRes, exercisesRes] = await Promise.all([
    supabase.from('concepts').select('id', { count: 'exact', head: true }),
    supabase.from('exercises').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Content and usage at a glance</p>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Content
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminStatCard label="Concepts" value={conceptsRes.count ?? 0} />
          <AdminStatCard label="Exercises" value={exercisesRes.count ?? 0} />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Usage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Suspense fallback={<AdminOverviewDeferredSkeleton />}>
            <AdminOverviewDeferred />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
