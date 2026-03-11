export default function AccountLoading() {
  return (
    <main className="max-w-lg mx-auto p-6 md:p-8 space-y-8 pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-32 rounded-lg senda-skeleton-fill animate-senda-pulse" />
        <div className="h-4 w-48 rounded senda-skeleton-fill animate-senda-pulse" />
      </div>

      {/* Form fields skeleton */}
      <div className="senda-card space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 rounded senda-skeleton-fill animate-senda-pulse" />
            <div className="h-10 w-full rounded-md senda-skeleton-fill animate-senda-pulse" />
          </div>
        ))}
        <div className="h-10 w-full rounded-full senda-skeleton-fill animate-senda-pulse mt-2" />
      </div>
    </main>
  )
}
