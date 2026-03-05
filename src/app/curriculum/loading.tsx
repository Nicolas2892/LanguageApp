export default function CurriculumLoading() {
  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted animate-pulse" />
      </div>

      {/* Module accordion skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-xl border p-5 space-y-3 shadow-sm">
          <div className="h-5 w-48 rounded bg-muted animate-pulse" />
          <div className="space-y-2 pl-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 w-full rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
