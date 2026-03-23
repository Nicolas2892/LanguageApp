export default function VocabSessionLoading() {
  return (
    <main className="max-w-2xl mx-auto p-6 md:p-10">
      <div className="flex flex-col min-h-[calc(100dvh-10rem)]">
        {/* Progress bar */}
        <div className="h-1 w-full senda-skeleton-fill animate-senda-pulse rounded-full" />

        {/* Eyebrow */}
        <div className="flex items-center gap-2 mt-4">
          <div className="h-3 w-20 senda-skeleton-fill animate-senda-pulse rounded" />
          <div className="h-3 w-32 senda-skeleton-fill animate-senda-pulse rounded" />
        </div>

        {/* Card */}
        <div className="flex-1 flex flex-col justify-center py-4">
          <div className="senda-card space-y-4">
            <div className="h-5 w-full senda-skeleton-fill animate-senda-pulse rounded" />
            <div className="h-5 w-3/4 senda-skeleton-fill animate-senda-pulse rounded" />
            <div className="h-4 w-2/3 senda-skeleton-fill animate-senda-pulse rounded" />
          </div>

          {/* Input area */}
          <div className="mt-3 space-y-3">
            <div className="h-12 w-full senda-skeleton-fill animate-senda-pulse rounded-xl" />
            <div className="h-12 w-full senda-skeleton-fill animate-senda-pulse rounded-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
