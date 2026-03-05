export default function StudyLoading() {
  return (
    <main className="max-w-xl mx-auto p-6 md:p-8 space-y-6">
      {/* Progress bar skeleton */}
      <div className="h-2 w-full rounded-full bg-muted animate-pulse" />

      {/* Exercise card skeleton */}
      <div className="bg-card rounded-2xl border p-6 space-y-4 shadow-sm">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-6 w-full rounded bg-muted animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
        </div>

        {/* Input area skeleton */}
        <div className="h-24 w-full rounded-lg bg-muted animate-pulse" />

        {/* Submit button skeleton */}
        <div className="h-10 w-full rounded-full bg-muted animate-pulse" />
      </div>
    </main>
  )
}
