export default function ProgressLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10 space-y-8 pb-24 lg:pb-10">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
      </div>

      {/* Stats chips skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border p-5 space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            <div className="h-7 w-12 rounded bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="h-48 w-full rounded-lg bg-muted animate-pulse" />
      </div>
    </main>
  )
}
