export default function PronunciationLoading() {
  return (
    <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-6 pb-24 lg:pb-10">
      <div>
        <div className="senda-skeleton-fill animate-senda-pulse h-7 w-48 rounded" />
        <div className="senda-skeleton-fill animate-senda-pulse h-3 w-32 rounded mt-3" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="senda-card" style={{ padding: '0.75rem 1rem' }}>
            <div className="senda-skeleton-fill animate-senda-pulse h-4 w-28 rounded mb-2" />
            <div className="senda-skeleton-fill animate-senda-pulse h-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <div className="senda-skeleton-fill animate-senda-pulse h-11 rounded-full" />
    </main>
  )
}
