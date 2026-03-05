export default function DashboardLoading() {
  return (
    <main className="max-w-lg mx-auto p-6 md:p-8 space-y-6">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>

      {/* Stats card skeleton */}
      <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-6">
          <div className="h-12 w-24 rounded-lg bg-muted animate-pulse" />
          <div className="h-12 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted animate-pulse" />
      </div>

      {/* Mode cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3 bg-card">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-6 w-40 rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  )
}
