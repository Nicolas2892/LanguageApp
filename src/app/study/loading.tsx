export default function StudyLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-8 space-y-6">
      {/* Progress bar skeleton */}
      <div className="h-2 w-full rounded-full senda-skeleton-fill animate-senda-pulse" />

      {/* Exercise card skeleton */}
      <div className="senda-card space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded senda-skeleton-fill animate-senda-pulse" />
          <div className="h-6 w-full rounded senda-skeleton-fill animate-senda-pulse" />
          <div className="h-6 w-3/4 rounded senda-skeleton-fill animate-senda-pulse" />
        </div>

        {/* Input area skeleton */}
        <div className="h-24 w-full rounded-lg senda-skeleton-fill animate-senda-pulse" />

        {/* Submit button skeleton */}
        <div className="h-10 w-full rounded-full senda-skeleton-fill animate-senda-pulse" />
      </div>
    </main>
  )
}
