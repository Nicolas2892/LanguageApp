export default function AccountLoading() {
  return (
    <main className="max-w-lg mx-auto p-6 md:p-8 space-y-8 pb-24 lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>

      {/* Form fields skeleton */}
      <div className="bg-card rounded-xl border p-6 space-y-4 shadow-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          </div>
        ))}
        <div className="h-10 w-full rounded-full bg-muted animate-pulse mt-2" />
      </div>
    </main>
  )
}
