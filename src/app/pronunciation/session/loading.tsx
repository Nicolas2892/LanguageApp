export default function PronunciationSessionLoading() {
  return (
    <main className="max-w-2xl mx-auto px-5 pt-6 pb-24 lg:pb-10 min-h-[100dvh] flex flex-col">
      <div className="shrink-0 flex items-center gap-3 mb-4">
        <div className="senda-skeleton-fill animate-senda-pulse h-1 flex-1 rounded-full" />
      </div>
      <div className="senda-skeleton-fill animate-senda-pulse h-3 w-36 rounded mb-4" />
      <div className="flex-1 flex flex-col justify-center py-4">
        <div className="senda-card space-y-4">
          <div className="senda-skeleton-fill animate-senda-pulse h-5 w-full rounded" />
          <div className="senda-skeleton-fill animate-senda-pulse h-5 w-3/4 rounded" />
          <div className="senda-skeleton-fill animate-senda-pulse h-7 w-7 rounded-full" />
        </div>
      </div>
      <div className="shrink-0">
        <div className="senda-skeleton-fill animate-senda-pulse h-12 rounded-full" />
      </div>
    </main>
  )
}
